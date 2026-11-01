import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client.js';
import { Button } from '../../../components/ui.jsx';
import { TrainingUpdateCard } from './TrainingSessionCard.jsx';

export default function Updates() {
  const [items, setItems] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await api(`/training/updates?page=${nextPage}&limit=20`);
      setItems(result.items);
      setPage(result.page);
      setPages(result.pages);
    } catch (err) {
      setError(err.message || 'Could not load training updates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') load(page); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load, page]);

  return (
    <section className="training-page" aria-labelledby="training-updates-page-heading">
      <header className="training-section-heading">
        <div><h2 id="training-updates-page-heading">Training updates</h2><p>Class announcements and news from the Steeze team.</p></div>
      </header>
      {error && <div className="training-inline-error" role="alert">{error}<button className="link" onClick={() => load(page)}>Retry</button></div>}
      {items?.length ? items.map((item) => <TrainingUpdateCard item={item} key={item.id} />) : items && !loading && (
        <div className="training-empty">No training updates yet.</div>
      )}
      {loading && !items && <div className="training-skeleton-list" aria-busy="true"><div className="training-skeleton-card" /></div>}
      {pages > 1 && (
        <nav className="training-pagination" aria-label="Training update pages">
          <Button className="line sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button className="line sm" disabled={page >= pages || loading} onClick={() => load(page + 1)}>Next</Button>
        </nav>
      )}
    </section>
  );
}
