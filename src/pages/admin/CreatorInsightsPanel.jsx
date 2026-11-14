import { useCallback, useEffect, useState } from 'react';
import { api, download, qs } from '../../api/client.js';
import { Button, Pill } from '../../components/ui.jsx';
import { fullNumber } from '../../lib/format.js';

const EMPTY_FILTERS = {
  registeredFrom: '',
  registeredTo: '',
  cohort: '',
  verification: '',
  interview: '',
  country: '',
  state: '',
  niche: '',
  lookingFor: '',
  experienceLevel: '',
  hideSmall: true,
  trendBy: 'country',
};

const INTERVIEW_OPTIONS = [
  ['none', 'Not queued'],
  ['awaiting', 'Awaiting'],
  ['contacted', 'Contacted'],
  ['scheduled', 'Scheduled'],
  ['completed', 'Completed'],
  ['no_show', 'No-show'],
  ['unreachable', 'Unreachable'],
  ['withdrawn', 'Withdrawn'],
  ['waived', 'Waived'],
  ['unassigned', 'Unassigned'],
];

const CSV_OPTIONS = [
  ['country', 'Countries'],
  ['state', 'States / regions'],
  ['city', 'Cities'],
  ['niche', 'Niches'],
  ['platform', 'Social platforms'],
  ['followerRange', 'Follower ranges'],
  ['lookingFor:collaborationInterests', 'Collaboration interests'],
  ['crosstab:nicheByCountry', 'Niche by country'],
  ['crosstab:lookingForByNiche', 'Collaboration interests by niche'],
  ['crosstab:lookingForByCountry', 'Collaboration interests by country'],
  ['segments', 'Top creator segments'],
];

function queryFor(filters) {
  return {
    ...filters,
    hideSmall: String(filters.hideSmall),
  };
}

function Distribution({ title, rows }) {
  return (
    <section className="creator-insights-card">
      <h3>{title}</h3>
      {rows?.length ? (
        <div className="creator-insights-distribution">
          {rows.map((row) => (
            <div className="creator-insights-distribution-row" key={row.key}>
              <div className="creator-insights-distribution-label">
                <span>{row.label}</span>
                <strong>{fullNumber(row.count)} <small>{row.pct}%</small></strong>
              </div>
              <div className="creator-insights-bar-track" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(0, row.pct || 0))}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : <p className="muted">No values meet the current filters.</p>}
    </section>
  );
}

function Crosstab({ title, rows }) {
  return (
    <section className="creator-insights-card">
      <h3>{title}</h3>
      {rows?.length ? (
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead><tr><th>Creator group</th><th>Profile value</th><th>Creators</th><th>Share</th></tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={`${row.row}-${row.column}`}>
                <td>{row.row}</td><td>{row.column}</td><td>{fullNumber(row.count)}</td><td>{row.pct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="muted">No combinations meet the current filters.</p>}
    </section>
  );
}

function CreatorTrend({ trend }) {
  if (!trend?.weeks?.length) return null;
  return (
    <section className="creator-insights-card creator-insights-trend">
      <h3>Creator registrations by week</h3>
      <p className="muted">Top segments are grouped by {trend.by}.</p>
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead><tr><th>Week starting</th><th>New creators</th><th>Top segments</th></tr></thead>
          <tbody>{trend.weeks.map((week) => (
            <tr key={week.week}>
              <td>{week.week}</td>
              <td>{fullNumber(week.total)}</td>
              <td>{week.segments.map((segment) => `${segment.key}: ${segment.count}`).join(' · ') || '—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function TopSegments({ rows }) {
  return (
    <section className="creator-insights-card">
      <h3>Top creator segments</h3>
      {rows?.length ? (
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead><tr><th>Country</th><th>Niche</th><th>Looking for</th><th>Creators</th><th>Share</th></tr></thead>
            <tbody>{rows.map((row, index) => (
              <tr key={`${row.country}-${row.niche}-${row.lookingFor}-${index}`}>
                <td>{row.country}</td><td>{row.niche}</td><td>{row.lookingFor}</td>
                <td>{fullNumber(row.count)}</td><td>{row.pct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="muted">No segments meet the current filters.</p>}
    </section>
  );
}

export default function CreatorInsightsPanel() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState(CSV_OPTIONS[0][0]);

  const load = useCallback(async (submittedFilters) => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/admin/analytics/creators${qs(queryFor(submittedFilters))}`);
      setReport(data);
      setAppliedFilters(submittedFilters);
    } catch (loadError) {
      setError(loadError.message || 'Could not load creator insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(EMPTY_FILTERS); }, [load]);

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const exportCsv = async () => {
    setExporting(true);
    setError('');
    try {
      await download(`/admin/analytics/creators/export.csv${qs({
        ...queryFor(appliedFilters),
        section,
      })}`);
    } catch (exportError) {
      setError(exportError.message || 'Could not export creator insights.');
    } finally {
      setExporting(false);
    }
  };

  const distributions = report?.distributions || {};
  const distributionGroups = [
    ['Countries', distributions.country],
    ['States / regions', distributions.state],
    ['Cities', distributions.city],
    ['Markets', distributions.market],
    ['Niches', distributions.niche],
    ['Content formats', distributions.contentFormat],
    ['Social platforms', distributions.platform],
    ['Follower ranges', distributions.followerRange],
    ['Availability', distributions.availability],
    ['Experience level', distributions.experienceLevel],
    ['Student status', distributions.studentShare],
    ['Cohorts', distributions.cohort],
    ['Verification', distributions.verification],
    ['Interview status', distributions.interview],
    ['Looking for', distributions.lookingFor?.collaborationInterests],
  ];

  return (
    <section className="creator-insights">
      <header className="creator-insights-header">
        <div>
          <h2>Creator insights</h2>
          <p>Aggregated profile and interview trends. Individual creator details are not included.</p>
        </div>
        <div className="creator-insights-export">
          <label className="field">
            <span>CSV data</span>
            <select className="input" value={section} onChange={(event) => setSection(event.target.value)}>
              {CSV_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Button className="line sm" loading={exporting} disabled={!report} onClick={exportCsv}>Export CSV</Button>
          <Button className="line sm" loading={loading} onClick={() => load(appliedFilters)}>Refresh</Button>
        </div>
      </header>

      <form className="creator-insights-filters" onSubmit={(event) => { event.preventDefault(); void load(filters); }}>
        <label className="field"><span>Registered from</span><input className="input" type="date" value={filters.registeredFrom} onChange={update('registeredFrom')} /></label>
        <label className="field"><span>Registered to</span><input className="input" type="date" value={filters.registeredTo} onChange={update('registeredTo')} /></label>
        <label className="field"><span>Cohort</span><input className="input" maxLength={80} value={filters.cohort} onChange={update('cohort')} placeholder="All cohorts" /></label>
        <label className="field">
          <span>Verification</span>
          <select className="input" value={filters.verification} onChange={update('verification')}>
            <option value="">All states</option><option value="verified">Verified</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="field">
          <span>Interview</span>
          <select className="input" value={filters.interview} onChange={update('interview')}>
            <option value="">All statuses</option>
            {INTERVIEW_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field"><span>Country</span><input className="input" maxLength={80} value={filters.country} onChange={update('country')} /></label>
        <label className="field"><span>State / region</span><input className="input" maxLength={80} value={filters.state} onChange={update('state')} /></label>
        <label className="field"><span>Niche</span><input className="input" maxLength={80} value={filters.niche} onChange={update('niche')} /></label>
        <label className="field"><span>Looking for</span><input className="input" maxLength={80} value={filters.lookingFor} onChange={update('lookingFor')} /></label>
        <label className="field">
          <span>Experience level</span>
          <select className="input" value={filters.experienceLevel} onChange={update('experienceLevel')}>
            <option value="">All levels</option><option value="beginner">Beginner</option><option value="some">Some experience</option><option value="experienced">Experienced</option>
          </select>
        </label>
        <label className="field">
          <span>Trend segments by</span>
          <select className="input" value={filters.trendBy} onChange={update('trendBy')}>
            <option value="country">Country</option><option value="niche">Niche</option>
          </select>
        </label>
        <label className="creator-insights-mask">
          <input type="checkbox" checked={filters.hideSmall} onChange={update('hideSmall')} />
          <span>Hide groups smaller than 5</span>
        </label>
        <div className="creator-insights-filter-actions">
          <Button className="primary sm" type="submit" loading={loading}>Apply filters</Button>
        </div>
      </form>

      {error && <div className="adm-overview-error" role="alert"><div><h2>Creator insights unavailable</h2><p>{error}</p></div><Button className="line sm" onClick={() => load(appliedFilters)}>Retry</Button></div>}
      {loading && !report && <div className="adm-overview-loading" aria-busy="true"><div /><div /><div /></div>}
      {report && (
        <>
          <div className="creator-insights-summary">
            <div><span>Creators in report</span><strong>{fullNumber(report.total)}</strong></div>
            <div><span>Generated</span><strong>{new Date(report.generatedAt).toLocaleString()}</strong></div>
            <Pill tone={report.truncated ? 'wait' : 'ok'}>{report.truncated ? 'Capped at 20,000' : 'Complete data set'}</Pill>
          </div>
          {report.warning && <p className="analytics-notice">{report.warning} Narrow the filters for a more specific view.</p>}
          <p className="creator-insights-privacy">Small groups are suppressed when enabled. Location regions are inferred from profile location labels.</p>
          <div className="creator-insights-grid">
            {distributionGroups.map(([title, rows]) => <Distribution key={title} title={title} rows={rows} />)}
            <CreatorTrend trend={report.trend} />
            <TopSegments rows={report.topSegments} />
            <Crosstab title="Niche by country" rows={report.crosstabs?.nicheByCountry} />
            <Crosstab title="Looking for by niche" rows={report.crosstabs?.lookingForByNiche} />
            <Crosstab title="Looking for by country" rows={report.crosstabs?.lookingForByCountry} />
          </div>
        </>
      )}
    </section>
  );
}
