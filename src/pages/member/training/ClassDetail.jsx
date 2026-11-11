import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../../../api/client.js';
import { Button } from '../../../components/ui.jsx';
import { TrainingSessionCard, TrainingSessionSkeleton } from './TrainingSessionCard.jsx';

export default function ClassDetail() {
  const { id } = useParams();
  const location = useLocation();
  const kind = location.pathname.includes('/webinars') ? 'webinar' : 'class';
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const result = await api(`/training/sessions/${encodeURIComponent(id)}${kind === 'webinar' ? '?kind=webinar' : ''}`);
      setItem(result.item);
    } catch (err) {
      setError(err.message || 'Could not load this class.');
    }
  }, [id, kind]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load]);

  if (error && !item) return (
    <div className="training-error" role="alert">
      <h2>{kind === 'webinar' ? 'Webinar unavailable' : 'Class unavailable'}</h2><p>{error}</p><Button className="primary sm" onClick={load}>Retry</Button>
      <Link to={kind === 'webinar' ? '/app/webinars' : '/app/training/classes'} className="link">Back to {kind === 'webinar' ? 'webinars' : 'classes'}</Link>
    </div>
  );
  if (!item) return <TrainingSessionSkeleton count={1} />;
  return (
    <section className="training-page training-detail">
      <Link className="link" to={kind === 'webinar' ? '/app/webinars' : '/app/training/classes'}>← Back to {kind === 'webinar' ? 'webinars' : 'classes'}</Link>
      {error && <div className="training-inline-error" role="alert">{error}</div>}
      <TrainingSessionCard item={item} detailed />
    </section>
  );
}
