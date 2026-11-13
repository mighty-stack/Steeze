import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/Auth.jsx';

const statusTone = {
  awaiting: 'wait',
  contacted: 'wait',
  scheduled: 'ok',
  completed: 'ok',
  no_show: 'bad',
  unreachable: 'off',
  withdrawn: 'off',
  waived: 'off',
};

function statusLabel(value) {
  return String(value || 'unknown').replace(/_/g, ' ');
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [staffDashboard, staffMe] = await Promise.all([
          api('/staff/dashboard'),
          api('/staff/me'),
        ]);
        if (!active) return;
        setDashboard(staffDashboard);
        setMe(staffMe);
        setError('');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Could not load your dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="db-skeleton" aria-busy="true" aria-label="Loading staff dashboard">
        <div className="db-skeleton-banner" />
        <div className="db-stat-grid">{[0, 1, 2].map((item) => <div className="db-skeleton-stat" key={item} />)}</div>
      </div>
    );
  }

  if (error) {
    return <p className="db-fallback">{error}</p>;
  }

  const summary = dashboard?.summary || {};
  const recent = dashboard?.recent || [];
  const displayName = user?.displayName || me?.name || 'Staff member';

  return (
    <>
      <section className="staff-hero db-panel">
        <div>
          <p className="eyebrow">Staff dashboard</p>
          <h1>Welcome back, {displayName}</h1>
          <p className="lede">Track your assigned interviews and stay on top of the next action.</p>
        </div>
        <Link className="btn primary sm" to="/staff/interviews">View my interviews</Link>
      </section>

      <div className="db-stat-grid">
        <div className="db-stat">
          <span>Open interviews</span>
          <strong>{summary.openInterviews ?? 0}</strong>
          <small>Assigned to you</small>
        </div>
        <div className="db-stat">
          <span>Completed</span>
          <strong>{summary.completedInterviews ?? 0}</strong>
          <small>Finished</small>
        </div>
        <div className="db-stat">
          <span>Timezone</span>
          <strong>{summary.timezone || me?.timezone || 'Africa/Lagos'}</strong>
          <small>Working window</small>
        </div>
      </div>

      <section className="db-panel">
        <div className="panel-header-row">
          <h2>Recent interviews</h2>
          <Link className="link" to="/staff/interviews">Open queue</Link>
        </div>
        {recent.length ? (
          <div className="list-table">
            {recent.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.user?.name || 'Creator'}</strong>
                  <small>{item.user?.email || 'No email on file'}</small>
                </div>
                <span className={`pill ${statusTone[item.status] || 'off'}`}>{statusLabel(item.status)}</span>
                <time>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'No date set'}</time>
              </div>
            ))}
          </div>
        ) : (
          <p className="db-fallback">No interviews have been assigned to you yet.</p>
        )}
      </section>
    </>
  );
}
