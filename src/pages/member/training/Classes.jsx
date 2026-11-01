import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, qs } from '../../../api/client.js';
import { Button } from '../../../components/ui.jsx';
import { TrainingSessionCard, TrainingSessionSkeleton } from './TrainingSessionCard.jsx';

const LIMIT = 12;

export default function Classes() {
  const [params, setParams] = useSearchParams();
  const when = params.get('when') === 'past' ? 'past' : 'upcoming';
  const topic = params.get('topic') || '';
  const page = Number(params.get('page')) || 1;
  const [search, setSearch] = useState(params.get('q') || '');
  const [topics, setTopics] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api(`/training/sessions${qs({ when, topic, q: params.get('q'), page, limit: LIMIT })}`);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not load training classes.');
    } finally {
      setLoading(false);
    }
  }, [when, topic, page, params]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api('/options').then((options) => setTopics(options.trainingTopic || [])).catch((err) => setError(err.message || 'Could not load training topics.'));
  }, []);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (params.get('q') || '')) updateParam('q', search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, params]);

  return (
    <section className="training-page" aria-labelledby="training-classes-heading">
      <header className="training-section-heading">
        <div><h2 id="training-classes-heading">Classes</h2><p>Browse live, upcoming and past training classes.</p></div>
      </header>
      <div className="training-class-filters">
        <div className="training-tab-list" role="tablist" aria-label="Class time">
          {['upcoming', 'past'].map((value) => (
            <button type="button" role="tab" aria-selected={when === value} className={when === value ? 'on' : ''} key={value} onClick={() => updateParam('when', value)}>
              {value === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>
        <label><span className="sr-only">Filter by topic</span>
          <select className="select" value={topic} onChange={(event) => updateParam('topic', event.target.value)}>
            <option value="">All topics</option>
            {topics.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label><span className="sr-only">Search classes</span>
          <input className="input" type="search" value={search} maxLength={100} placeholder="Search classes" onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>
      {error && <div className="training-inline-error" role="alert">{error}<button className="link" onClick={load}>Retry</button></div>}
      {loading && !result ? <TrainingSessionSkeleton /> : result?.items.length ? result.items.map((item) => <TrainingSessionCard item={item} key={item.id} />) : !loading && (
        <div className="training-empty">{when === 'upcoming' ? 'No upcoming classes yet. Check back soon.' : 'No past classes yet.'}</div>
      )}
      {result?.pages > 1 && (
        <nav className="training-pagination" aria-label="Class pages">
          <Button className="line sm" disabled={page <= 1 || loading} onClick={() => updateParam('page', String(page - 1))}>Previous</Button>
          <span>Page {result.page} of {result.pages}</span>
          <Button className="line sm" disabled={page >= result.pages || loading} onClick={() => updateParam('page', String(page + 1))}>Next</Button>
        </nav>
      )}
    </section>
  );
}
