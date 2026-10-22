import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { api, download, ApiError, qs } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { useAdminOptions } from '../../lib/useAdminOptions.js';
import { Button, Pill, ConfirmDialog, cx } from '../../components/ui.jsx';
import { relativeDay, formatDate, initial, compactNumber, platformLabel, STATUS, statusOf } from '../../lib/format.js';
import EditProfileModal from './EditProfileModal.jsx';
import RejectModal from './RejectModal.jsx';

const PAGE_SIZE = 20;
const TABS = [
  { key: 'all', label: 'All', query: {} },
  { key: 'brand', label: 'Brands', query: { role: 'brand' } },
  { key: 'creator', label: 'Creators', query: { role: 'creator' } },
  { key: 'pending', label: 'Pending', query: { verificationStatus: 'pending' } },
];

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function Registrations() {
  const { refreshStats } = useOutletContext();
  const toast = useToast();
  const { options } = useAdminOptions();
  const [params, setParams] = useSearchParams();
  const accessCodeId = params.get('accessCode') || '';
  const [accessCodeLabel, setAccessCodeLabel] = useState('');
  const [accessCodeLabelError, setAccessCodeLabelError] = useState('');

  const [tab, setTab] = useState(() => (params.get('unseen') === 'true' ? 'all' : 'all'));
  const [q, setQ] = useState('');
  const debouncedQ = useDebounced(q, 350);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const onlyUnseen = params.get('unseen') === 'true';

  useEffect(() => {
    if (!accessCodeId) {
      setAccessCodeLabel('');
      setAccessCodeLabelError('');
      return undefined;
    }
    let alive = true;
    api('/admin/access-codes')
      .then(({ items }) => {
        if (alive) setAccessCodeLabel(items.find((item) => item.id === accessCodeId)?.code || accessCodeId);
      })
      .catch((err) => {
        if (alive) setAccessCodeLabelError(err.message);
      });
    return () => { alive = false; };
  }, [accessCodeId]);

  const [list, setList] = useState(null); // { items, total, pages }
  const [listError, setListError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [modal, setModal] = useState(null); // 'edit' | 'reject' | 'delete' | 'deactivate' | null
  const requestId = useRef(0);

  const query = {
    ...TABS.find((t) => t.key === tab).query,
    q: debouncedQ,
    category,
    location,
    ...(onlyUnseen ? { unseen: 'true' } : {}),
    ...(accessCodeId ? { accessCode: accessCodeId } : {}),
  };

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setListError('');
    try {
      const data = await api(`/admin/users${qs({ ...query, page, limit: PAGE_SIZE })}`);
      if (id === requestId.current) setList(data);
    } catch (err) {
      if (id === requestId.current) setListError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedQ, category, location, page, onlyUnseen, accessCodeId]);

  useEffect(() => { setList(null); load(); }, [load]);
  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) load();
    };
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [load]);
  useEffect(() => { setPage(1); }, [tab, debouncedQ, category, location, onlyUnseen, accessCodeId]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null); setDetailError('');
    try {
      const data = await api(`/admin/users/${id}`);
      setDetail(data);
      refreshStats();
      setList((l) => l && { ...l, items: l.items.map((u) => (u.id === id ? { ...u, seenByAdmin: true } : u)) });
    } catch (err) {
      setDetailError(err.message);
    }
  };

  const clearUnseenFilter = () => setParams((p) => { p.delete('unseen'); return p; }, { replace: true });
  const clearAccessCodeFilter = () => setParams((p) => { p.delete('accessCode'); return p; }, { replace: true });

  const act = async (action, id, extra) => {
    setBusyAction(action);
    try {
      let res;
      if (action === 'reject') res = await api(`/admin/users/${id}/reject`, { method: 'POST', body: { reason: extra } });
      else if (action === 'deactivate') res = await api(`/admin/users/${id}/deactivate`, { method: 'POST' });
      else if (action === 'reactivate') res = await api(`/admin/users/${id}/reactivate`, { method: 'POST' });
      else if (action === 'delete') { await api(`/admin/users/${id}`, { method: 'DELETE' }); }

      if (action === 'delete') {
        toast(`${detail.user.displayName} was deleted.`);
        setSelectedId(null); setDetail(null); setModal(null);
      } else {
        setDetail((d) => ({ ...d, user: res.user }));
        setList((l) => l && { ...l, items: l.items.map((u) => (u.id === id ? { ...u, ...res.user } : u)) });
        setModal(null);
        toast({ reject: 'Registration rejected.', deactivate: 'Account deactivated.', reactivate: 'Account reactivated.' }[action]);
      }
      refreshStats();
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Something went wrong.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const exportCsv = async () => {
    setBusyAction('export');
    try {
      await download(`/admin/users/export.csv${qs(query)}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const selected = list?.items.find((u) => u.id === selectedId);

  return (
    <section className="adm-body">
      <div className="adm-head">
        <div>
          <h1>Registrations</h1>
          <p>{list ? `${list.total} account${list.total === 1 ? '' : 's'}${onlyUnseen ? ', showing new ones only' : ''}.` : '\u00A0'}</p>
        </div>
        <div className="head-actions">
          <Button className="line sm" loading={busyAction === 'export'} onClick={exportCsv}>Export to CSV</Button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => <button key={t.key} className={cx(tab === t.key && 'on')} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      <div className="filters">
        <input className="input expand" placeholder="Search by name, email or handle" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search registrations" />
        <select className="select input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category or niche">
          <option value="">Category or niche</option>
          {options && [...options.category, ...options.niche].map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select className="select input" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Filter by location">
          <option value="">Location</option>
          {options?.location.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>
      {onlyUnseen && (
        <div className="filter-note">
          Showing only new, unopened registrations. <button className="link" onClick={clearUnseenFilter}>Show all</button>
        </div>
      )}
      {accessCodeId && (
        <div className="filter-note">
          Filtered by code {accessCodeLabel || accessCodeId}.{' '}
          {accessCodeLabelError && <span className="text-err">{accessCodeLabelError}</span>}
          <button className="link" onClick={clearAccessCodeFilter}>Clear filter</button>
        </div>
      )}

      <div className={cx('content-drawer', selectedId !== null && 'with-drawer')}>
        <div className="reg-table">
          <div className="scroll">
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Category</th><th>Location</th><th>Registered</th><th>Status</th></tr>
              </thead>
              <tbody>
                {!list && !listError && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="skeleton"><td colSpan={6}><div style={{ width: `${60 + (i % 3) * 10}%` }} /></td></tr>
                ))}
                {list?.items.map((u) => {
                  const status = statusOf(u);
                  return (
                    <tr key={u.id} className={cx(u.id === selectedId && 'sel')} onClick={() => openDetail(u.id)}>
                      <td>
                        <button className="row-btn">
                          <div className="nm">{!u.seenByAdmin && <span className="newdot" title="New" />}{u.displayName}</div>
                          <div className="sub">{u.email}</div>
                        </button>
                      </td>
                      <td className="ty"><span className={cx('dot', u.role === 'brand' ? 'b' : 'c')} />{u.role === 'brand' ? 'Brand' : 'Creator'}</td>
                      <td>{u.categoryOrNiche?.label || '\u2013'}</td>
                      <td>{u.location?.label || '\u2013'}</td>
                      <td>{relativeDay(u.createdAt)}</td>
                      <td><Pill tone={status.tone}>{status.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {listError && <div className="table-empty"><h3>Could not load registrations</h3><p>{listError}</p><button className="btn line sm mt-3" onClick={load}>Try again</button></div>}
          {list && list.items.length === 0 && !listError && (
            <div className="table-empty"><h3>No registrations match</h3><p>Try a different search or clear the filters.</p></div>
          )}
          {list && list.total > 0 && (
            <div className="pager">
              <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, list.total)} of {list.total}</span>
              <div className="pg">
                <button className="link" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button className="link" disabled={page >= list.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>

        {selectedId && (
          <aside className="drawer">
            <div className="t">
              <div className={cx('avatar', selected?.role === 'brand' ? 'b' : 'c')}>{initial(selected?.displayName || detail?.user?.displayName)}</div>
              <div>
                <h2>{selected?.displayName || detail?.user?.displayName}</h2>
                <div className="meta">{selected?.role === 'brand' ? 'Brand' : 'Creator'} &middot; Registered {formatDate(selected?.createdAt || detail?.user?.createdAt)}</div>
              </div>
              <button className="close" onClick={() => setSelectedId(null)} aria-label="Close">&times;</button>
            </div>

            {detailError && <div className="form-error mt-4">{detailError}</div>}
            {!detail && !detailError && <p className="muted mt-5">Loading&hellip;</p>}

            {detail && (
              <>
                <div className="mt-3.5"><Pill tone={statusOf(detail.user).tone}>{statusOf(detail.user).label}</Pill></div>
                <div className="meta mt-2">
                  {detail.user.referral
                    ? `Referred by ${detail.user.referral.ownerName} (${detail.user.referral.code})`
                    : 'No access code'}
                </div>
                {detail.user.verificationStatus === 'rejected' && detail.user.rejectionReason && (
                  <div className="drawer note">Reason: {detail.user.rejectionReason}</div>
                )}

                {detail.user.role === 'brand' ? (
                  <dl className="kv">
                    <div><dt>Contact</dt><dd>{detail.profile.contactPerson}<br />{detail.profile.contactEmail}<br />{detail.profile.phone}</dd></div>
                    <div><dt>Category</dt><dd>{detail.profile.category.label}</dd></div>
                    <div><dt>Location</dt><dd>{detail.profile.location.label}</dd></div>
                    {detail.profile.website && <div><dt>Website</dt><dd><a className="link" href={detail.profile.website} target="_blank" rel="noreferrer">{detail.profile.website.replace(/^https?:\/\//, '')}</a></dd></div>}
                    <div><dt>Offers</dt><dd>{detail.profile.productsServices}</dd></div>
                    <div><dt>Wants to do</dt><dd><span className="chip-list">{detail.profile.collaborationInterests.map((o) => <span key={o.id} className="chip-static">{o.label}</span>)}</span></dd></div>
                  </dl>
                ) : (
                  <dl className="kv">
                    <div><dt>Full name</dt><dd>{detail.profile.fullName}</dd></div>
                    <div><dt>Niche</dt><dd>{detail.profile.niche.label}</dd></div>
                    <div><dt>Location</dt><dd>{detail.profile.location.label}</dd></div>
                    <div><dt>Socials</dt><dd>{detail.profile.socials.map((s) => (
                      <div key={s.platform}>{platformLabel(s.platform)}: @{s.handle} ({compactNumber(s.followers)})</div>
                    ))}</dd></div>
                    {detail.profile.audienceNotes && <div><dt>Audience</dt><dd>{detail.profile.audienceNotes}</dd></div>}
                    <div><dt>Content</dt><dd>{detail.profile.contentDescription}</dd></div>
                    <div><dt>Wants to do</dt><dd><span className="chip-list">{detail.profile.collaborationInterests.map((o) => <span key={o.id} className="chip-static">{o.label}</span>)}</span></dd></div>
                  </dl>
                )}

                <div className="act">
                  <div className="row2">
                    <button className="btn line sm" onClick={() => setModal('edit')}>Edit details</button>
                    {detail.user.verificationStatus !== 'rejected' && <button className="btn line sm" onClick={() => setModal('reject')}>Reject</button>}
                  </div>
                  {detail.user.accountStatus === 'active' ? (
                    <button className="btn danger sm" onClick={() => setModal('deactivate')}>Deactivate</button>
                  ) : (
                    <Button className="line sm" loading={busyAction === 'reactivate'} onClick={() => act('reactivate', detail.user.id)}>Reactivate</Button>
                  )}
                  <button className="btn danger sm" onClick={() => setModal('delete')}>Delete permanently</button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {modal === 'edit' && detail && options && (
        <EditProfileModal
          user={detail.user} profile={detail.profile} options={options} onClose={() => setModal(null)}
          onSaved={(u, p) => {
            setDetail({ user: u, profile: p });
            setList((l) => l && { ...l, items: l.items.map((x) => (x.id === u.id ? { ...x, ...u } : x)) });
            setModal(null);
            toast('Profile updated.');
          }}
        />
      )}
      {modal === 'reject' && detail && (
        <RejectModal name={detail.user.displayName} onClose={() => setModal(null)} onConfirm={(reason) => act('reject', detail.user.id, reason)} />
      )}
      {modal === 'deactivate' && detail && (
        <ConfirmDialog
          title={`Deactivate ${detail.user.displayName}?`}
          message="They will not be able to log in until reactivated." confirmLabel="Deactivate"
          onClose={() => setModal(null)} onConfirm={() => act('deactivate', detail.user.id)}
        />
      )}
      {modal === 'delete' && detail && (
        <ConfirmDialog
          title={`Delete ${detail.user.displayName}?`}
          message="This permanently removes the account and profile. This cannot be undone." confirmLabel="Delete permanently"
          requireText={detail.user.displayName} onClose={() => setModal(null)} onConfirm={() => act('delete', detail.user.id)}
        />
      )}
    </section>
  );
}
