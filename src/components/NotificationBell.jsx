import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/Toast.jsx';
import {
  emitNotificationsChanged,
  NOTIFICATIONS_CHANGED_EVENT,
  notificationDestination,
  notificationTime,
} from '../lib/notifications.js';
import { track } from '../lib/analytics/track.js';

export default function NotificationBell({ role }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const data = await api('/notifications?limit=5');
      setResult(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load notifications.');
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 60_000);
    const refresh = () => load();
    window.addEventListener('focus', refresh);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, [open]);

  const openNotification = async (item) => {
    if (busyId) return;
    track('notification_open', { type: item.category || 'other' });
    setOpen(false);
    if (!item.isRead) {
      setBusyId(item.id);
      try {
        await api(`/notifications/${encodeURIComponent(item.id)}/read`, { method: 'POST' });
        emitNotificationsChanged();
      } catch (err) {
        toast(err.message || 'Could not mark this notification as read.', 'error');
      } finally {
        setBusyId('');
      }
    }
    navigate(notificationDestination(item.link, role));
  };

  const unreadTotal = result?.unreadTotal || 0;
  return (
    <div className="notification-bell" ref={menuRef}>
      <button
        type="button"
        className="notification-bell-toggle"
        aria-label={`Notifications${unreadTotal ? `, ${unreadTotal} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        <span className="sr-only">Notifications</span>
        {unreadTotal > 0 && <span className="notification-bell-count">{unreadTotal > 99 ? '99+' : unreadTotal}</span>}
      </button>
      {open && (
        <section className="notification-popover" role="dialog" aria-label="Recent notifications">
          <div className="notification-popover-heading">
            <h2>Notifications</h2>
            <span>{unreadTotal ? `${unreadTotal} unread` : 'All caught up'}</span>
          </div>
          {error ? (
            <div className="notification-popover-error" role="alert">
              <p>{error}</p>
              <button type="button" className="link" onClick={load}>Try again</button>
            </div>
          ) : !result ? (
            <p className="notification-popover-empty" role="status">Loading notifications...</p>
          ) : result.items.length ? (
            <ul className="notification-popover-list">
              {result.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification-popover-item${item.isRead ? '' : ' unread'}`}
                    onClick={() => openNotification(item)}
                    disabled={Boolean(busyId)}
                  >
                    <span className="notification-unread-dot" aria-hidden="true" />
                    <span className="notification-popover-copy">
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <small>{notificationTime(item.createdAt)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notification-popover-empty">New updates will appear here.</p>
          )}
          <button
            type="button"
            className="notification-popover-all"
            onClick={() => {
              setOpen(false);
              navigate(role === 'admin' ? '/admin/notifications' : '/app/notifications');
            }}
          >
            View all notifications
          </button>
        </section>
      )}
    </div>
  );
}
