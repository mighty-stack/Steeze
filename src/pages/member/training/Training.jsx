import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/client.js';
import { Button } from '../../../components/ui.jsx';
import { TrainingSessionCard, TrainingSessionSkeleton, TrainingUpdateCard } from './TrainingSessionCard.jsx';

function sessionDetailRoute(item) {
  if (!item) return '/app/training/classes';
  return item.kind === 'webinar' ? `/app/webinars/${encodeURIComponent(item.id)}` : `/app/training/classes/${encodeURIComponent(item.id)}`;
}

export default function Training() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setData(await api('/training/overview'));
    } catch (err) {
      setError(err.message || 'Could not load training.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  if (error && !data) return (
    <div className="training-error" role="alert">
      <h2>Training is unavailable</h2><p>{error}</p>
      <Button className="primary sm" onClick={load}>Retry</Button>
    </div>
  );
  if (!data) return <TrainingSessionSkeleton />;

  const firstLiveKind = data.live[0]?.kind === 'webinar' ? 'webinar' : 'class';
  const upcomingKind = data.upcoming.some((item) => item.kind === 'webinar') ? 'webinar' : 'class';

  return (
    <div className="training-page" aria-busy={loading || undefined}>
      {error && <div className="training-inline-error" role="alert">{error}<button className="link" onClick={load}>Retry</button></div>}
      {data.live.length > 0 && (
        <section className="training-live-section" aria-labelledby="training-live-heading">
          <div className="training-live-banner">
            <div>
              <span className="training-live-label">Happening now</span>
              <h2 id="training-live-heading">{data.live[0].title}</h2>
              <p>{data.live[0].hostName ? `Hosted by ${data.live[0].hostName}` : `Join the live ${firstLiveKind === 'webinar' ? 'webinar' : 'class'} with the Steeze team.`}</p>
            </div>
            <Link className="btn white" to={sessionDetailRoute(data.live[0])}>View and join</Link>
          </div>
          {data.live.length > 1 && data.live.slice(1).map((item) => <TrainingSessionCard item={item} key={item.id} />)}
        </section>
      )}

      <section className="training-section" aria-labelledby="training-upcoming-heading">
        <header className="training-section-heading">
          <div><h2 id="training-upcoming-heading">{upcomingKind === 'webinar' ? 'Upcoming webinars' : 'Upcoming classes'}</h2><p>Learn, connect, and grow with the Steeze community.</p></div>
          <Link className="btn line sm" to={upcomingKind === 'webinar' ? '/app/training/webinars?when=upcoming' : '/app/training/classes?when=upcoming'}>{upcomingKind === 'webinar' ? 'Browse webinars' : 'Browse classes'}</Link>
        </header>
        {data.upcoming.length ? data.upcoming.map((item) => <TrainingSessionCard item={item} key={item.id} />) : (
          <div className="training-empty">{upcomingKind === 'webinar' ? 'No upcoming webinars yet. Check back soon.' : 'No upcoming classes yet. Check back soon.'}</div>
        )}
      </section>

      <section className="training-section" aria-labelledby="training-updates-heading">
        <header className="training-section-heading">
          <div><h2 id="training-updates-heading">Latest updates</h2><p>News and changes from the Steeze training team.</p></div>
          <Link className="btn line sm" to="/app/training/updates">All updates</Link>
        </header>
        {data.updates.length ? data.updates.map((item) => <TrainingUpdateCard item={item} key={item.id} />) : (
          <div className="training-empty">Training updates will appear here.</div>
        )}
      </section>

      <section className="training-section" aria-labelledby="training-recent-heading">
        <header className="training-section-heading">
          <div><h2 id="training-recent-heading">{data.recent.some((item) => item.kind === 'webinar') ? 'Recent webinars' : 'Recent classes'}</h2><p>Revisit a session and find its recording and resources.</p></div>
          <Link className="btn line sm" to={data.recent.some((item) => item.kind === 'webinar') ? '/app/training/webinars?when=past' : '/app/training/classes?when=past'}>{data.recent.some((item) => item.kind === 'webinar') ? 'Past webinars' : 'Past classes'}</Link>
        </header>
        {data.recent.length ? data.recent.map((item) => <TrainingSessionCard item={item} key={item.id} />) : (
          <div className="training-empty">{data.recent.some((item) => item.kind === 'webinar') ? 'Past webinars and recordings will appear here.' : 'Past classes and recordings will appear here.'}</div>
        )}
      </section>
    </div>
  );
}
