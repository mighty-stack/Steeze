import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

const statusOptions = ['all', 'awaiting', 'contacted', 'scheduled', 'completed', 'no_show', 'unreachable', 'withdrawn', 'waived'];

function statusLabel(value) {
  return String(value || 'unknown').replace(/_/g, ' ');
}

function toneForStatus(status) {
  const map = {
    awaiting: 'wait',
    contacted: 'wait',
    scheduled: 'ok',
    completed: 'ok',
    no_show: 'bad',
    unreachable: 'off',
    withdrawn: 'off',
    waived: 'off',
  };
  return map[status] || 'off';
}

export default function StaffInterviews() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ page: String(page), limit: '20' });
        if (status !== 'all') query.set('status', status);
        const data = await api(`/staff/interviews?${query}`);
        if (active) setResult(data);
      } catch (err) {
        if (active) setError(err.message || 'Could not load interviews.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [status, page]);

  return (
    <section className="db-panel">
      <div className="panel-header-row">
        <h1>My interviews</h1>
        <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'All statuses' : statusLabel(option)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="db-fallback">Loading interviews...</p>
      ) : error ? (
        <p className="db-fallback">{error}</p>
      ) : !result?.items?.length ? (
        <p className="db-fallback">No interviews match this filter.</p>
      ) : (
        <>
          <div className="list-table">
            {result.items.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.user?.name || 'Creator'}</strong>
                  <small>{item.user?.email || 'No email on file'}</small>
                </div>
                <span className={`pill ${toneForStatus(item.status)}`}>{statusLabel(item.status)}</span>
                <time>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'No date set'}</time>
              </div>
            ))}
          </div>
          <div className="pagination-row">
            <button type="button" className="btn line sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {page} of {result.pages || 1}</span>
            <button type="button" className="btn line sm" disabled={page >= (result.pages || 1)} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}
