import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Button, Pill } from '../../components/ui.jsx';
import LevelBadge from '../../components/LevelBadge.jsx';
import { useAuth } from '../../context/Auth.jsx';
import { useOptions } from '../../lib/useOptions.js';
import '../../styles/directory.css';

const EMPTY_RESULT = { items: [], total: 0, page: 1, pages: 1, limit: 24 };

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function FilterFields({ values, options, onChange }) {
  const select = (name, label, list) => (
    <label className="creator-directory-filter" key={name}>
      <span>{label}</span>
      <select value={values[name] || ''} onChange={(event) => onChange(name, event.target.value)}>
        <option value="">All</option>
        {(list || []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  );
  return (
    <>
      {select('niche', 'Niche', options?.niche)}
      {select('location', 'Location', options?.location)}
      {select('skill', 'Skill', options?.skill)}
      {select('format', 'Content format', options?.contentFormat)}
      {select('language', 'Language', options?.language)}
      <label className="creator-directory-filter">
        <span>Level</span>
        <select value={values.level || ''} onChange={(event) => onChange('level', event.target.value)}>
          <option value="">All levels</option>
          {['intern', 'emerging', 'rising', 'established', 'professional'].map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}
        </select>
      </label>
      <label className="creator-directory-filter">
        <span>Availability</span>
        <select value={values.availability || ''} onChange={(event) => onChange('availability', event.target.value)}>
          <option value="">Any</option>
          {['available', 'limited', 'unavailable'].map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
        </select>
      </label>
      <label className="creator-directory-filter">
        <span>Student creator</span>
        <select value={values.student || ''} onChange={(event) => onChange('student', event.target.value)}>
          <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
        </select>
      </label>
      <label className="creator-directory-filter">
        <span>Minimum rating</span>
        <select value={values.minRating || ''} onChange={(event) => onChange('minRating', event.target.value)}>
          <option value="">Any rating</option><option value="3">3+</option><option value="4">4+</option><option value="4.5">4.5+</option>
        </select>
      </label>
    </>
  );
}

function CreatorCard({ creator }) {
  return (
    <article className="creator-directory-card">
      <div className="creator-directory-card-head">
        <div className="creator-directory-avatar" aria-hidden="true">{creator.creatorName?.trim()?.[0]?.toUpperCase() || '?'}</div>
        <div className="creator-directory-card-title">
          <h2><Link to={`/app/creators/${creator.id}`}>{creator.creatorName}</Link></h2>
          {creator.headline && <p>{creator.headline}</p>}
        </div>
      </div>
      <div className="creator-directory-meta">
        <span>{creator.niche?.label || 'Creator'}{creator.location?.label ? ` · ${creator.location.label}` : ''}</span>
        <LevelBadge level={creator.level} />
      </div>
      <Pill tone={creator.availability === 'available' ? 'ok' : 'off'}>
        {creator.availability}
      </Pill>
      {creator.isStudent && <span className="creator-directory-student">Student creator</span>}
      {!!creator.skills?.length && (
        <div className="creator-directory-chips">
          {creator.skills.slice(0, 3).map((skill) => <span className="chip-static" key={skill.id}>{skill.label}</span>)}
        </div>
      )}
      <div className="creator-directory-card-footer">
        <span>{creator.completedGigs > 0 ? `${creator.completedGigs} ${creator.completedGigs === 1 ? 'gig' : 'gigs'} completed` : 'New'}</span>
        {creator.ratingAvg !== null && <span aria-label={`Average rating ${creator.ratingAvg}`}>★ {Number(creator.ratingAvg).toFixed(1)}</span>}
      </div>
    </article>
  );
}

export default function CreatorDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { options } = useOptions();
  const initialValues = useMemo(() => Object.fromEntries(searchParams.entries()), []);
  const [search, setSearch] = useState(initialValues.q || '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [result, setResult] = useState(EMPTY_RESULT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const debouncedSearch = useDebounced(search, 300);
  const values = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const value = debouncedSearch.trim();
    const previous = next.get('q') || '';
    if (value) next.set('q', value);
    else next.delete('q');
    if (value !== previous) next.delete('page');
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [debouncedSearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/creators?${searchParams.toString()}`)
      .then((data) => { if (active) setResult(data); })
      .catch((err) => { if (active) setError(err.message || 'Could not load creators.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [searchParams, retry]);

  useEffect(() => {
    if (user.role !== 'creator') return undefined;
    let active = true;
    api('/collaborations/unread')
      .then(({ unread: count }) => { if (active) setUnread(count || 0); })
      .catch((err) => console.error('Could not load collaboration request count.', err));
    return () => { active = false; };
  }, [user.role, searchParams]);

  const change = (field, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(field, value);
    else next.delete(field);
    next.delete('page');
    setSearchParams(next);
  };
  const clearFilters = () => {
    setSearch('');
    setSearchParams({});
  };
  const changePage = (page) => {
    const next = new URLSearchParams(searchParams);
    if (page === 1) next.delete('page');
    else next.set('page', String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const firstItem = result.total ? ((result.page - 1) * result.limit) + 1 : 0;
  const lastItem = Math.min(result.page * result.limit, result.total);

  return (
    <div className="creator-directory">
      <nav className="creator-directory-tabs" aria-label="Creator tools">
        <Link className="is-current" to="/app/creators">Discover</Link>
        {user.role === 'creator' && <Link to="/app/collaborations">Requests{unread > 0 && <span className="creator-directory-unread">{unread}</span>}</Link>}
      </nav>
      <div className="creator-directory-search">
        <label htmlFor="creator-directory-query">Search creators</label>
        <input id="creator-directory-query" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, headline or social handle" />
      </div>
      <div className="creator-directory-layout">
        <aside className="creator-directory-filters">
          <div className="creator-directory-filter-title"><h2>Filters</h2><button className="link" onClick={clearFilters}>Clear</button></div>
          <FilterFields values={values} options={options} onChange={change} />
        </aside>
        <section className="creator-directory-results" aria-live="polite">
          <div className="creator-directory-toolbar">
            <Button className="line creator-directory-mobile-filter-button" onClick={() => setMobileFiltersOpen(true)}>Filters</Button>
            <label className="creator-directory-sort">
              <span>Sort by</span>
              <select value={values.sort || 'best'} onChange={(event) => change('sort', event.target.value)}>
                <option value="best">Best match</option><option value="newest">Newest</option>
                <option value="most_completed">Most completed gigs</option><option value="most_followers">Most followers</option>
              </select>
            </label>
            {!loading && <span className="creator-directory-count">Showing {firstItem}–{lastItem} of {result.total}</span>}
          </div>
          {error ? (
            <div className="card creator-directory-error" role="alert">
              <p>{error}</p><Button className="primary" onClick={() => setRetry((value) => value + 1)}>Retry</Button>
            </div>
          ) : loading ? (
            <div className="creator-directory-grid" aria-label="Loading creators">
              {Array.from({ length: 6 }, (_, index) => <div className="creator-directory-skeleton" key={index} />)}
            </div>
          ) : result.items.length ? (
            <>
              <div className="creator-directory-grid">{result.items.map((creator) => <CreatorCard key={creator.id} creator={creator} />)}</div>
              {result.pages > 1 && <div className="creator-directory-pagination">
                <Button className="line" disabled={result.page <= 1} onClick={() => changePage(result.page - 1)}>Previous</Button>
                <span>Page {result.page} of {result.pages}</span>
                <Button className="line" disabled={result.page >= Math.min(result.pages, 50)} onClick={() => changePage(result.page + 1)}>Next</Button>
              </div>}
            </>
          ) : (
            <div className="card creator-directory-empty"><h2>No creators found</h2><p>Try changing your search or filters.</p><Button className="line" onClick={clearFilters}>Clear filters</Button></div>
          )}
        </section>
      </div>
      {mobileFiltersOpen && <div className="creator-directory-sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setMobileFiltersOpen(false)}>
        <section className="creator-directory-sheet" role="dialog" aria-modal="true" aria-labelledby="creator-directory-sheet-title">
          <div className="creator-directory-filter-title"><h2 id="creator-directory-sheet-title">Filters</h2><button className="link" onClick={() => setMobileFiltersOpen(false)}>Close</button></div>
          <FilterFields values={values} options={options} onChange={change} />
          <Button className="primary" onClick={() => setMobileFiltersOpen(false)}>Show creators</Button>
        </section>
      </div>}
    </div>
  );
}
