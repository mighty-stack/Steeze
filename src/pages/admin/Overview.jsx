import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, qs } from '../../api/client.js';
import { Button, Pill } from '../../components/ui.jsx';
import { formatDate, fullNumber, statusOf } from '../../lib/format.js';

const RANGES = [7, 30, 90];

function SectionUnavailable() {
  return <p className="adm-overview-unavailable">Couldn't load this.</p>;
}

function OverviewChart({ rows }) {
  const totalBrands = rows.reduce((sum, row) => sum + row.brands, 0);
  const totalCreators = rows.reduce((sum, row) => sum + row.creators, 0);
  const max = Math.max(1, ...rows.map((row) => row.brands + row.creators));
  const chartTop = 16;
  const chartHeight = 142;
  const chartWidth = 900;
  const step = rows.length ? chartWidth / rows.length : chartWidth;
  const barWidth = Math.max(2, Math.min(14, step * 0.62));
  const labelIndexes = [...new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1])];
  const shortDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' });

  return (
    <div className="adm-overview-chart">
      <div className="adm-overview-legend" aria-hidden="true">
        <span><i className="adm-overview-brand-key" />Brands</span>
        <span><i className="adm-overview-creator-key" />Creators</span>
      </div>
      <svg
        className="adm-overview-svg"
        viewBox="0 0 900 200"
        role="img"
        aria-label={`Sign-ups by day: ${fullNumber(totalBrands)} brands and ${fullNumber(totalCreators)} creators.`}
        preserveAspectRatio="none"
      >
        <line x1="0" y1={chartTop + chartHeight} x2="900" y2={chartTop + chartHeight} className="adm-overview-axis" />
        {rows.map((row, index) => {
          const x = index * step + (step - barWidth) / 2;
          const brandHeight = (row.brands / max) * chartHeight;
          const creatorHeight = (row.creators / max) * chartHeight;
          return (
            <g key={row.date}>
              <title>{`${row.date}: ${row.brands} brands, ${row.creators} creators`}</title>
              <rect x={x} y={chartTop + chartHeight - brandHeight} width={barWidth} height={brandHeight} rx="2" className="adm-overview-brand-bar" />
              <rect x={x} y={chartTop + chartHeight - brandHeight - creatorHeight} width={barWidth} height={creatorHeight} rx="2" className="adm-overview-creator-bar" />
            </g>
          );
        })}
        {labelIndexes.map((index) => {
          const row = rows[index];
          if (!row) return null;
          const x = index * step + step / 2;
          return <text key={row.date} x={x} y="186" textAnchor="middle" className="adm-overview-date-label">{shortDate(row.date)}</text>;
        })}
      </svg>
      <table className="sr-only">
        <caption>Daily sign-ups by member type</caption>
        <thead><tr><th>Date</th><th>Brands</th><th>Creators</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.date}><th>{row.date}</th><td>{row.brands}</td><td>{row.creators}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function StatTile({ label, value, to, change }) {
  return (
    <Link className="adm-overview-stat" to={to}>
      <span>{label}</span>
      <strong>{fullNumber(value)}</strong>
      {change && (
        <span className="adm-overview-change" aria-label={`${change.direction} ${Math.abs(change.value)} new members compared with the previous range`}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d={change.value >= 0 ? 'M8 13V3m0 0L4 7m4-4 4 4' : 'M8 3v10m0 0 4-4m-4 4-4-4'} />
          </svg>
          {change.value >= 0 ? `+${change.value}` : change.value} {change.direction}
        </span>
      )}
    </Link>
  );
}

export default function Overview() {
  const { refreshStats } = useOutletContext();
  const refreshStatsRef = useRef(refreshStats);
  refreshStatsRef.current = refreshStats;
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setError('');
    setLoading(true);
    try {
      const overview = await api(`/admin/overview${qs({ days })}`);
      if (id === requestId.current) {
        setData(overview);
        refreshStatsRef.current?.();
      }
    } catch (err) {
      if (id === requestId.current) setError(err.message || 'Could not load the overview.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onFocus = () => { if (!document.hidden) load(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const totals = data?.totals;
  const delta = totals ? totals.newMembers - totals.previousMembers : 0;
  const newMemberLink = data?.signupsByDay?.length
    ? `/admin/registrations${qs({ from: data.signupsByDay[0].date, to: data.signupsByDay[data.signupsByDay.length - 1].date })}`
    : '/admin/registrations';

  return (
    <main className="adm-body adm-overview">
      <header className="adm-head adm-overview-head">
        <div><h1>Overview</h1><p>Platform health and the work that needs your attention.</p></div>
        <div className="adm-overview-actions">
          <div className="adm-overview-ranges" aria-label="Sign-up date range">
            {RANGES.map((range) => (
              <button type="button" key={range} className={days === range ? 'adm-overview-range-active' : ''} aria-pressed={days === range} onClick={() => setDays(range)}>
                Last {range} days
              </button>
            ))}
          </div>
          <Button className="line sm" loading={loading} onClick={load}>Refresh</Button>
        </div>
      </header>

      {error && (
        <div className="adm-overview-error" role="alert">
          <div><h2>Could not load the overview</h2><p>{error}</p></div>
          <Button className="line sm" onClick={load}>Retry</Button>
        </div>
      )}
      {loading && !error && (
        <div className="adm-overview-loading" aria-busy="true" aria-label="Loading admin overview">
          <div /><div /><div />
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="adm-overview-section" aria-labelledby="adm-overview-attention">
            <h2 id="adm-overview-attention">Needs attention</h2>
            {data.attention === null ? <SectionUnavailable /> : data.attention.length ? (
              <div className="adm-overview-attention">
                {data.attention.map((item) => (
                  <Link className={`adm-overview-attention-item ${item.severity === 'high' ? 'adm-overview-high' : ''}`} key={item.type} to={item.link}>
                    <span>{item.text}</span><strong>{fullNumber(item.count)}</strong>
                  </Link>
                ))}
              </div>
            ) : <div className="adm-overview-calm">You're all caught up.</div>}
          </section>

          <section className="adm-overview-section" aria-labelledby="adm-overview-platform">
            <h2 id="adm-overview-platform">Platform at a glance</h2>
            {totals === null ? <SectionUnavailable /> : (
              <>
                <div className="adm-overview-stats">
                  <StatTile label="Total members" value={totals.members} to="/admin/registrations" />
                  <StatTile label={`New in last ${days} days`} value={totals.newMembers} to={newMemberLink} change={{ value: delta, direction: delta >= 0 ? 'up' : 'down' }} />
                  <StatTile label="Brands" value={totals.brands} to="/admin/registrations?role=brand" />
                  <StatTile label="Creators" value={totals.creators} to="/admin/registrations?role=creator" />
                </div>
                {totals.members === 0 && (
                  <div className="adm-overview-empty">
                    <h3>No members yet</h3>
                    <p>Create an access code to start inviting people, or add an opportunity to get started.</p>
                    <div><Link className="btn blue sm" to="/admin/access-codes">Access Codes</Link><Link className="btn line sm" to="/admin/opportunities">Opportunities</Link></div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="adm-overview-section" aria-labelledby="adm-overview-signups">
            <h2 id="adm-overview-signups">Sign-ups</h2>
            {data.signupsByDay === null ? <SectionUnavailable /> : <div className="adm-overview-card"><OverviewChart rows={data.signupsByDay} /></div>}
          </section>

          <section className="adm-overview-section" aria-labelledby="adm-overview-recent">
            <div className="adm-overview-section-head"><h2 id="adm-overview-recent">Recent registrations</h2><Link className="link" to="/admin/registrations">View all</Link></div>
            {data.recentRegistrations === null ? <SectionUnavailable /> : data.recentRegistrations.length ? (
              <div className="adm-overview-card adm-overview-list">
                {data.recentRegistrations.map((member) => {
                  const status = statusOf({ verificationStatus: member.status, accountStatus: member.status === 'deactivated' ? 'deactivated' : 'active' });
                  return (
                    <Link className="adm-overview-row" to={`/admin/registrations?open=${encodeURIComponent(member.id)}`} key={member.id}>
                      <span className="adm-overview-person"><strong>{member.displayName}</strong><small>{member.email} · {member.role === 'brand' ? 'Brand' : 'Creator'}</small></span>
                      <Pill tone={status.tone}>{status.label}</Pill>
                      <time dateTime={member.createdAt}>{formatDate(member.createdAt)}</time>
                    </Link>
                  );
                })}
              </div>
            ) : <div className="adm-overview-calm">No registrations yet.</div>}
          </section>

          {data.referrals !== null ? (
            <section className="adm-overview-section" aria-labelledby="adm-overview-referrals">
              <h2 id="adm-overview-referrals">Where members come from</h2>
              <div className="adm-overview-card adm-overview-list">
                {data.referrals.topCodes.map((item) => (
                  <Link className="adm-overview-row" to={`/admin/registrations?accessCode=${encodeURIComponent(item.id)}`} key={item.id}>
                    <span className="adm-overview-person"><strong>{item.code}</strong><small>{item.ownerName} · {item.ownerType}</small></span><span>{fullNumber(item.signups)} sign-ups</span>
                  </Link>
                ))}
                <div className="adm-overview-row"><span className="adm-overview-person"><strong>No code</strong><small>Sign-ups without an access code</small></span><span>{fullNumber(data.referrals.withoutCode)} sign-ups</span></div>
              </div>
            </section>
          ) : <section className="adm-overview-section"><h2>Where members come from</h2><SectionUnavailable /></section>}

          {data.gigs !== null ? (
            <section className="adm-overview-section" aria-labelledby="adm-overview-gigs">
              <div className="adm-overview-section-head">
                <h2 id="adm-overview-gigs">Gigs</h2>
                <Link className="btn line sm" to="/admin/opportunities?status=pending_review">Review queue ({data.gigs.pendingReview})</Link>
              </div>
              <div className="adm-overview-gig-stats">
                {[
                  ['Live', data.gigs.live],
                  ['Pending review', data.gigs.pendingReview],
                  ['Closed', data.gigs.closed],
                  ['Rejected', data.gigs.rejected],
                ].map(([label, value]) => <div className="adm-overview-gig-stat" key={label}><span>{label}</span><strong>{fullNumber(value)}</strong></div>)}
              </div>
              <div className="adm-overview-card adm-overview-list">
                {data.gigs.topGigsByInterest.length ? data.gigs.topGigsByInterest.map((gig) => (
                  <Link className="adm-overview-row" to="/admin/opportunities" key={gig.id}>
                    <span className="adm-overview-person"><strong>{gig.title}</strong></span><span>{fullNumber(gig.interestCount)} interests</span>
                  </Link>
                )) : <p className="adm-overview-unavailable">No recent gig interests.</p>}
              </div>
            </section>
          ) : <section className="adm-overview-section"><h2>Gigs</h2><SectionUnavailable /></section>}
        </>
      )}
    </main>
  );
}
