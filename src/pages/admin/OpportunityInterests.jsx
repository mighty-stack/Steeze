import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api, download, qs } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { Button, Pill, Splash, cx } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';

const PAGE_SIZE = 20;
const FILTERS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'declined', label: 'Declined' },
  { key: 'withdrawn', label: 'Withdrawn' },
];
const STATUS = {
  pending: { label: 'Pending', tone: 'wait' },
  shortlisted: { label: 'Shortlisted', tone: 'ok' },
  declined: { label: 'Declined', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'off' },
};

export default function OpportunityInterests() {
  const { id } = useParams();
  const { refreshStats } = useOutletContext();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setError('');
    try {
      const result = await api(`/admin/opportunities/${id}/interests${qs({ status, page, limit: PAGE_SIZE })}`);
      setList(result);
      setNotes((current) => ({
        ...Object.fromEntries(result.items.map((item) => [item.id, item.adminNote || ''])),
        ...current,
      }));
      refreshStats();
    } catch (err) {
      setError(err.message || 'Could not load opportunity interests.');
    }
  };

  useEffect(() => { load(); }, [id, status, page]);

  const updateStatus = async (item, nextStatus) => {
    const previous = list;
    setBusyId(item.id);
    setList((current) => current && ({
      ...current,
      items: current.items.map((row) => row.id === item.id ? { ...row, status: nextStatus } : row),
    }));
    try {
      const result = await api(`/admin/interests/${item.id}`, { method: 'PATCH', body: { status: nextStatus } });
      setList((current) => current && ({
        ...current,
        items: current.items.map((row) => row.id === item.id ? { ...row, ...result.interest } : row),
      }));
      toast(nextStatus === 'pending' ? 'Interest reset.' : `Interest ${nextStatus}.`);
      refreshStats();
      await load();
    } catch (err) {
      setList(previous);
      toast(err.message || 'Could not update this interest.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const saveNote = async (item) => {
    setBusyId(item.id);
    try {
      const result = await api(`/admin/interests/${item.id}`, {
        method: 'PATCH',
        body: { adminNote: notes[item.id] || '' },
      });
      setList((current) => current && ({
        ...current,
        items: current.items.map((row) => row.id === item.id ? { ...row, adminNote: result.interest.adminNote } : row),
      }));
      toast('Admin note saved.');
    } catch (err) {
      toast(err.message || 'Could not save the admin note.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await download(`/admin/opportunities/${id}/interests/export.csv${qs({ status })}`);
    } catch (err) {
      toast(err.message || 'Could not export the interest list.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const selectStatus = (value) => {
    setPage(1);
    setStatus(value);
  };

  return (
    <section className="adm-body">
      <div className="adm-head">
        <div>
          <Link className="link text-sm" to="/admin/opportunities">← Opportunities</Link>
          <h1 className="mt-2">Opportunity interests</h1>
          <p>{list ? `${list.total} member${list.total === 1 ? '' : 's'} interested.` : 'Review members who expressed interest.'}</p>
        </div>
        <div className="head-actions">
          <Button className="line sm" loading={exporting} onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter interests by status">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={status === filter.key}
            className={cx(status === filter.key && 'on')}
            onClick={() => selectStatus(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && <div className="form-error mt-4" role="alert">{error}<button className="link ml-2" onClick={load}>Try again</button></div>}
      {!list && !error && <Splash />}
      {list && list.items.length === 0 && (
        <div className="table-empty mt-4">
          <h3>No interests found</h3>
          <p>There are no members in this status yet.</p>
        </div>
      )}
      {list && list.items.length > 0 && (
        <div className="reg-table mt-4">
          <div className="scroll">
            <table className="min-w-[1250px]">
              <thead>
                <tr>
                  <th>Member</th><th>Type</th><th>Category / niche</th><th>Location</th>
                  <th>Message</th><th>Date</th><th>Status</th><th>Admin note</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((item) => {
                  const state = STATUS[item.status];
                  const profileUrl = `/admin/registrations?open=${encodeURIComponent(item.user?.id || '')}`;
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link className="link" to={profileUrl}>{item.user?.displayName || 'Deleted member'}</Link>
                        {item.user?.email && <div className="sub">{item.user.email}</div>}
                      </td>
                      <td className="whitespace-nowrap">{item.role === 'brand' ? 'Brand' : 'Creator'}</td>
                      <td>{item.user?.category || '—'}</td>
                      <td>{item.user?.location || '—'}</td>
                      <td className="max-w-[260px] whitespace-pre-wrap">{item.message || '—'}</td>
                      <td className="whitespace-nowrap">{formatDate(item.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td><Pill tone={state?.tone || 'off'}>{state?.label || item.status}</Pill></td>
                      <td className="min-w-[230px]">
                        <textarea
                          className="textarea min-h-[72px] text-sm"
                          maxLength={500}
                          value={notes[item.id] ?? item.adminNote ?? ''}
                          onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                          aria-label={`Admin note for ${item.user?.displayName || 'member'}`}
                        />
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <small className="text-ink-soft">{(notes[item.id] ?? item.adminNote ?? '').length}/500</small>
                          <Button className="line sm" loading={busyId === item.id} disabled={Boolean(busyId)} onClick={() => saveNote(item)}>Save note</Button>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {item.status !== 'shortlisted' && item.status !== 'withdrawn' && (
                            <Button className="blue sm" loading={busyId === item.id} disabled={Boolean(busyId)} onClick={() => updateStatus(item, 'shortlisted')}>Shortlist</Button>
                          )}
                          {item.status !== 'declined' && item.status !== 'withdrawn' && (
                            <Button className="line sm" loading={busyId === item.id} disabled={Boolean(busyId)} onClick={() => updateStatus(item, 'declined')}>Decline</Button>
                          )}
                          {item.status !== 'pending' && item.status !== 'withdrawn' && (
                            <Button className="line sm" loading={busyId === item.id} disabled={Boolean(busyId)} onClick={() => updateStatus(item, 'pending')}>Reset</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, list.total)} of {list.total}</span>
            <div className="pg">
              <button className="link" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
              <button className="link" disabled={page >= list.pages} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
