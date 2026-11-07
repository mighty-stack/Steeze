import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/Auth.jsx';
import { useToast } from '../../context/Toast.jsx';
import { Button, Splash } from '../../components/ui.jsx';
import {
  emitNotificationsChanged,
  MUTABLE_NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORIES,
  notificationCategoryLabel,
  notificationDestination,
  notificationTime,
} from '../../lib/notifications.js';
import { formatDate } from '../../lib/format.js';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 20;

export default function Notifications() {
  const { user } = useAuth();
  const role = user?.role || 'creator';
  const toast = useToast();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [preferencesError, setPreferencesError] = useState('');
  const [preferenceBusy, setPreferenceBusy] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [adminForm, setAdminForm] = useState({ target: 'creator', title: '', body: '', link: '/app' });
  const [adminSending, setAdminSending] = useState(false);

  const loadPage = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoadError('');
    try {
      const data = await api(`/notifications?page=${page}&limit=${PAGE_SIZE}`);
      setResult((current) => ({
        ...data,
        items: append ? [...(current?.items || []), ...data.items] : data.items,
      }));
      setLoadError('');
    } catch (err) {
      const message = err.message || 'Could not load notifications.';
      if (!append) setLoadError(message);
      else toast(message, 'error');
    } finally {
      if (append) setLoadingMore(false);
    }
  }, [toast]);

  const loadPreferences = useCallback(async () => {
    try {
      const data = await api('/notifications/prefs');
      setPreferences(data.muted || []);
      setPreferencesError('');
    } catch (err) {
      setPreferencesError(err.message || 'Could not load notification preferences.');
    }
  }, []);

  useEffect(() => {
    loadPage();
    loadPreferences();
    const refresh = () => {
      loadPage();
      loadPreferences();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [loadPage, loadPreferences]);

  const visibleItems = useMemo(() => (result?.items || []).filter((item) => (
    (filter !== 'unread' || !item.isRead)
    && (categoryFilter === 'all' || item.category === categoryFilter)
  )), [result, filter, categoryFilter]);

  const markRead = async (item) => {
    if (busyId || item.isRead) return;
    setBusyId(item.id);
    try {
      await api(`/notifications/${encodeURIComponent(item.id)}/read`, { method: 'POST' });
      setResult((current) => current && ({
        ...current,
        unreadTotal: Math.max(0, current.unreadTotal - 1),
        items: current.items.map((entry) => entry.id === item.id
          ? { ...entry, isRead: true, readAt: new Date().toISOString() }
          : entry),
      }));
      emitNotificationsChanged();
    } catch (err) {
      toast(err.message || 'Could not mark this notification as read.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const markAllRead = async () => {
    setBulkBusy(true);
    try {
      await api('/notifications/read-all', { method: 'POST' });
      setResult((current) => current && ({
        ...current,
        unreadTotal: 0,
        items: current.items.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })),
      }));
      emitNotificationsChanged();
      toast('All notifications marked as read.');
    } catch (err) {
      toast(err.message || 'Could not mark notifications as read.', 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  const deleteNotification = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await api(`/notifications/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      setResult((current) => current && ({
        ...current,
        total: Math.max(0, current.total - 1),
        unreadTotal: Math.max(0, current.unreadTotal - (item.isRead ? 0 : 1)),
        items: current.items.filter((entry) => entry.id !== item.id),
      }));
      emitNotificationsChanged();
      toast('Notification deleted.');
    } catch (err) {
      toast(err.message || 'Could not delete this notification.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const toggleCategory = async (category) => {
    if (!preferences || preferenceBusy) return;
    const muted = preferences.includes(category);
    const next = muted ? preferences.filter((item) => item !== category) : [...preferences, category];
    setPreferenceBusy(category);
    try {
      const data = await api('/notifications/prefs', { method: 'PATCH', body: { muted: next } });
      setPreferences(data.muted || []);
      toast(`${notificationCategoryLabel(category)} notifications ${muted ? 'enabled' : 'muted'}.`);
    } catch (err) {
      toast(err.message || 'Could not update notification preferences.', 'error');
    } finally {
      setPreferenceBusy('');
    }
  };

  const openNotification = async (item) => {
    if (busyId) return;
    if (!item.isRead) await markRead(item);
    navigate(notificationDestination(item.link, role));
  };

  const sendAdminBroadcast = async (event) => {
    event.preventDefault();
    if (adminSending || !adminForm.title.trim() || !adminForm.body.trim()) return;
    setAdminSending(true);
    try {
      const payload = {
        target: adminForm.target,
        title: adminForm.title.trim(),
        body: adminForm.body.trim(),
        link: adminForm.link?.trim() || '/app',
      };
      const data = await api('/admin/notifications', { method: 'POST', body: payload });
      toast(`${data.sent || 0} ${payload.target === 'creator' ? 'creator' : 'brand'} notifications sent.`, 'ok');
      setAdminForm({ target: payload.target, title: '', body: '', link: '/app' });
      if (data.sent > 0) {
        loadPage();
      }
    } catch (err) {
      toast(err.message || 'Could not create this notification.', 'error');
    } finally {
      setAdminSending(false);
    }
  };

  const hasMore = Boolean(result && result.page < result.pages);
  const preferenceCategories = role === 'admin'
    ? MUTABLE_NOTIFICATION_CATEGORIES.filter((category) => category === 'admin')
    : role === 'creator'
      ? MUTABLE_NOTIFICATION_CATEGORIES.filter((category) => ['gigs', 'collaboration', 'training'].includes(category))
      : MUTABLE_NOTIFICATION_CATEGORIES.filter((category) => category === 'gigs');

  return (
    <section className="notifications-page" aria-labelledby="notifications-heading">
      <div className="notifications-page-heading">
        <div>
          <h2 id="notifications-heading">Your notifications</h2>
          <p>Updates about your account and activity on CloutLabs.</p>
        </div>
        {result?.unreadTotal > 0 && (
          <Button className="line sm" loading={bulkBusy} onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="notifications-filters">
        <div className="notification-filter-tabs" role="group" aria-label="Filter notifications">
          <button type="button" aria-pressed={filter === 'all'} className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
            All {result ? `(${result.total})` : ''}
          </button>
          <button type="button" aria-pressed={filter === 'unread'} className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>
            Unread {result ? `(${result.unreadTotal})` : ''}
          </button>
        </div>
        <label className="notification-category-filter">
          <span className="sr-only">Filter by category</span>
          <select className="select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {Object.entries(NOTIFICATION_CATEGORIES)
              .filter(([value]) => role !== 'brand' || value !== 'training')
              .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {role === 'admin' && (
        <section className="notification-admin-composer" aria-labelledby="admin-notification-composer-heading">
          <div>
            <h3 id="admin-notification-composer-heading">Send a broadcast</h3>
            <p>Push an in-app update to creators or brands.</p>
          </div>
          <form onSubmit={sendAdminBroadcast} className="notification-admin-form">
            <div className="notification-admin-grid">
              <label>
                <span>Audience</span>
                <select value={adminForm.target} onChange={(event) => setAdminForm((current) => ({ ...current, target: event.target.value }))}>
                  <option value="creator">Creators</option>
                  <option value="brand">Brands</option>
                </select>
              </label>
              <label>
                <span>Link</span>
                <input value={adminForm.link} onChange={(event) => setAdminForm((current) => ({ ...current, link: event.target.value }))} placeholder="/app" />
              </label>
            </div>
            <label>
              <span>Title</span>
              <input value={adminForm.title} onChange={(event) => setAdminForm((current) => ({ ...current, title: event.target.value }))} placeholder="Platform update" maxLength={120} />
            </label>
            <label>
              <span>Message</span>
              <textarea value={adminForm.body} onChange={(event) => setAdminForm((current) => ({ ...current, body: event.target.value }))} placeholder="Share a platform update, reminder, or important notice." maxLength={500} rows={5} />
            </label>
            <div className="notification-admin-actions">
              <Button type="submit" className="primary sm" loading={adminSending} disabled={!adminForm.title.trim() || !adminForm.body.trim()}>
                Send notification
              </Button>
            </div>
          </form>
        </section>
      )}

      {loadError ? (
        <div className="form-error mt-5" role="alert">
          {loadError} <button type="button" className="link ml-2" onClick={() => loadPage()}>Try again</button>
        </div>
      ) : !result ? (
        <Splash />
      ) : visibleItems.length ? (
        <ul className="notification-list">
          {visibleItems.map((item) => (
            <li className={`notification-row${item.isRead ? ' read' : ' unread'}`} key={item.id}>
              <span className="notification-unread-dot" aria-hidden="true" />
              <div className="notification-row-content">
                <div className="notification-row-heading">
                  <button type="button" className="notification-open" onClick={() => openNotification(item)}>
                    {item.title}
                  </button>
                  <span className="notification-category">{notificationCategoryLabel(item.category)}</span>
                </div>
                <p>{item.body}</p>
                <div className="notification-row-meta">
                  {item.actorName && <span>{item.actorName}</span>}
                  <time dateTime={item.createdAt} title={formatDate(item.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}>
                    {notificationTime(item.createdAt)}
                  </time>
                </div>
              </div>
              <div className="notification-row-actions">
                {!item.isRead && (
                  <button type="button" className="link" disabled={Boolean(busyId)} onClick={() => markRead(item)}>
                    Mark read
                  </button>
                )}
                <button type="button" className="notification-delete" disabled={Boolean(busyId)} onClick={() => deleteNotification(item)} aria-label={`Delete ${item.title}`}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="notification-empty">
          <h3>{hasMore ? 'More notifications' : filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}</h3>
          <p>{hasMore
            ? 'There may be matching updates on the next page. Load more to continue.'
            : filter === 'unread'
              ? 'Unread updates will show here.'
              : 'When there is an update, you will find it here.'}</p>
        </div>
      )}

      {hasMore && (
        <div className="notification-load-more">
          <Button className="line sm" loading={loadingMore} disabled={loadingMore} onClick={() => loadPage(result.page + 1, true)}>
            Load more
          </Button>
        </div>
      )}

      <section className="notification-preferences" aria-labelledby="notification-preferences-heading">
        <div>
          <h3 id="notification-preferences-heading">Notification preferences</h3>
          <p>Choose which optional updates can be sent to you.</p>
        </div>
        {preferencesError && (
          <p className="notification-preferences-error" role="alert">
            {preferencesError} <button type="button" className="link" onClick={loadPreferences}>Try again</button>
          </p>
        )}
        {!preferences && !preferencesError && <p className="muted" role="status">Loading preferences...</p>}
        {preferences && (
          <div className="notification-preference-options">
            {preferenceCategories.map((category) => {
              const muted = preferences.includes(category);
              return (
                <label className="notification-preference" key={category}>
                  <span>
                    <strong>{notificationCategoryLabel(category)}</strong>
                    <small>{category === 'gigs'
                      ? 'Announcements about new opportunities.'
                      : category === 'collaboration'
                        ? 'Collaboration requests and updates.'
                        : 'New registrations and opportunities awaiting review.'}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={!muted}
                    disabled={Boolean(preferenceBusy)}
                    onChange={() => toggleCategory(category)}
                    aria-label={`Receive ${notificationCategoryLabel(category).toLowerCase()} notifications`}
                  />
                </label>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
