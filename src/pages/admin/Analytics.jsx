import { useCallback, useEffect, useState } from 'react';
import { api, download, qs } from '../../api/client.js';
import { Button, Pill } from '../../components/ui.jsx';
import { fullNumber } from '../../lib/format.js';

const RANGES = [7, 30, 90];

function Breakdown({ title, rows }) {
  return (
    <section className="adm-overview-section">
      <h2>{title}</h2>
      {rows?.length ? (
        <div className="analytics-breakdown">
          {rows.map((row) => (
            <div className="analytics-breakdown-row" key={row.value}>
              <span>{row.value}</span><strong>{fullNumber(row.count)}</strong>
            </div>
          ))}
        </div>
      ) : <p className="adm-overview-unavailable">No data for this period.</p>}
    </section>
  );
}

function Stat({ label, value }) {
  return <div className="adm-overview-stat"><span>{label}</span><strong>{fullNumber(value || 0)}</strong></div>;
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [debug, setDebug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [debugError, setDebugError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setDebugError('');
    const [reportResult, debugResult] = await Promise.allSettled([
      api(`/admin/analytics${qs({ days })}`),
      api('/admin/analytics/debug'),
    ]);
    if (reportResult.status === 'fulfilled') setReport(reportResult.value);
    else setError(reportResult.reason?.message || 'Could not load analytics.');
    if (debugResult.status === 'fulfilled') setDebug(debugResult.value);
    else setDebugError(debugResult.reason?.message || 'Could not load analytics diagnostics.');
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await download(`/admin/analytics/export.csv${qs({ days })}`);
    } catch (exportError) {
      setError(exportError.message || 'Could not export analytics.');
    } finally {
      setExporting(false);
    }
  };

  const maxDaily = Math.max(1, ...(report?.series || []).map((day) => day.pageViews));

  return (
    <main className="adm-body adm-overview admin-analytics">
      <header className="adm-head adm-overview-head">
        <div><h1>Analytics</h1><p>Privacy-aware platform and product activity.</p></div>
        <div className="adm-overview-actions">
          <div className="adm-overview-ranges" aria-label="Analytics date range">
            {RANGES.map((range) => (
              <button type="button" key={range} className={days === range ? 'adm-overview-range-active' : ''} aria-pressed={days === range} onClick={() => setDays(range)}>
                Last {range} days
              </button>
            ))}
          </div>
          <Button className="line sm" loading={exporting} onClick={exportCsv}>Export CSV</Button>
          <Button className="line sm" loading={loading} onClick={load}>Refresh</Button>
        </div>
      </header>

      {report?.range && <p className="analytics-period">Showing {report.range.from} to {report.range.to}</p>}
      {error && <div className="adm-overview-error" role="alert"><div><h2>Could not load analytics</h2><p>{error}</p></div><Button className="line sm" onClick={load}>Retry</Button></div>}
      {loading && !report && <div className="adm-overview-loading" aria-busy="true"><div /><div /><div /></div>}

      {report && (
        <>
          {!report.enabled && <div className="analytics-notice">Analytics collection is currently disabled. Previously collected aggregate reports remain available.</div>}
          <section className="adm-overview-section" aria-labelledby="analytics-summary">
            <h2 id="analytics-summary">Activity summary</h2>
            <div className="adm-overview-stats analytics-stats">
              <Stat label="Sessions" value={report.totals.sessions} />
              <Stat label="Daily unique visitors" value={report.totals.visitors} />
              <Stat label="Active members" value={report.totals.activeUsers} />
              <Stat label="Page views" value={report.totals.pageViews} />
              <Stat label="Successful registrations" value={report.totals.registrations} />
              <Stat label="Successful logins" value={report.totals.loginSuccesses} />
              <Stat label="API requests" value={report.totals.apiRequests} />
              <Stat label="Client errors" value={report.totals.clientErrors} />
            </div>
          </section>

          <section className="adm-overview-section" aria-labelledby="analytics-traffic">
            <h2 id="analytics-traffic">Daily traffic</h2>
            <div className="adm-overview-card analytics-chart">
              {report.series.map((day) => (
                <div className="analytics-chart-day" key={day.day} title={`${day.day}: ${day.pageViews} page views`}>
                  <div className="analytics-chart-bar" style={{ height: `${Math.max(2, (day.pageViews / maxDaily) * 100)}%` }} />
                  <span>{day.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="analytics-grid">
            <Breakdown title="Top sources" rows={report.sources} />
            <Breakdown title="Top landing pages" rows={report.landingPages} />
            <Breakdown title="Most viewed pages" rows={report.topPages} />
            <Breakdown title="Devices" rows={report.devices} />
            <Breakdown title="Browsers" rows={report.browsers} />
            <Breakdown title="Registrations by role" rows={report.registrationsByRole} />
          </div>

          <section className="adm-overview-section" aria-labelledby="analytics-funnel">
            <h2 id="analytics-funnel">Registration funnel</h2>
            {report.funnel.length ? (
              <div className="analytics-breakdown">
                {report.funnel.map((item) => (
                  <div className="analytics-breakdown-row" key={`${item.flow}-${item.step}`}>
                    <span>{item.flow} · {item.step}</span><strong>{fullNumber(item.count)}</strong>
                  </div>
                ))}
              </div>
            ) : <p className="adm-overview-unavailable">No funnel events for this period.</p>}
          </section>

          <section className="adm-overview-section" aria-labelledby="analytics-api">
            <h2 id="analytics-api">API performance</h2>
            {report.apiPerformance.length ? (
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead><tr><th>Route</th><th>Status</th><th>Latency bucket</th><th>Requests</th><th>Average (ms)</th></tr></thead>
                  <tbody>{report.apiPerformance.map((item) => (
                    <tr key={`${item.route}-${item.status}-${item.latency}`}>
                      <td>{item.route}</td><td>{item.status}</td><td>{item.latency}</td><td>{fullNumber(item.count)}</td><td>{fullNumber(item.averageLatencyMs)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="adm-overview-unavailable">No API requests for this period.</p>}
          </section>

          <section className="adm-overview-section" aria-labelledby="analytics-diagnostics">
            <div className="adm-overview-section-head">
              <h2 id="analytics-diagnostics">Collection diagnostics</h2>
              {debug && <Pill tone={debug.enabled ? 'ok' : 'wait'}>{debug.enabled ? 'Enabled' : 'Disabled'}</Pill>}
            </div>
            {debugError && <p className="form-error" role="alert">{debugError}</p>}
            {debug && (
              <>
                <p className="analytics-period">Timezone: {debug.timezone} · Raw event retention: {debug.retentionDays.rawEvents} days · Session retention: {debug.retentionDays.sessions} days</p>
                {debug.filters.length ? (
                  <div className="analytics-breakdown">
                    {debug.filters.map((item, index) => (
                      <div className="analytics-breakdown-row" key={`${item.name}-${item.reason || index}`}>
                        <span>{item.name}{item.reason ? ` · ${item.reason}` : ''}</span><strong>{fullNumber(item.count)}</strong>
                      </div>
                    ))}
                  </div>
                ) : <p className="adm-overview-unavailable">No filtered or rejected events today.</p>}
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
