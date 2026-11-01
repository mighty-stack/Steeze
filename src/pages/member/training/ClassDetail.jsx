import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../../api/client.js';
import { Button } from '../../../components/ui.jsx';
import { TrainingSessionCard, TrainingSessionSkeleton } from './TrainingSessionCard.jsx';

export default function ClassDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const result = await api(`/training/sessions/${encodeURIComponent(id)}`);
      setItem(result.item);
    } catch (err) {
      setError(err.message || 'Could not load this class.');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load]);

  if (error && !item) return (
    <div className="training-error" role="alert">
      <h2>Class unavailable</h2><p>{error}</p><Button className="blue sm" onClick={load}>Retry</Button>
      <Link to="/app/training/classes" className="link">Back to classes</Link>
    </div>
  );
  if (!item) return <TrainingSessionSkeleton count={1} />;
  return (
    <section className="training-page training-detail">
      <Link className="link" to="/app/training/classes">← Back to classes</Link>
      {error && <div className="training-inline-error" role="alert">{error}</div>}
      <TrainingSessionCard item={item} detailed />
    </section>
  );
}
