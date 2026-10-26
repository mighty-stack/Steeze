import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Button, Pill } from '../../components/ui.jsx';
import LevelBadge from '../../components/LevelBadge.jsx';
import { SCORE_NAME, STANDING_COMPONENT_LABELS } from '../../lib/content.js';
import { formatDate } from '../../lib/format.js';

function ScoreSkeleton() {
  return <div className="score-skeleton" aria-busy="true" aria-label="Loading your score"><div /><div /><div /></div>;
}

export default function Score() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api('/standing'));
    } catch (err) {
      setError(err.message || 'Could not load your score.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <section className="score-page"><ScoreSkeleton /></section>;
  if (error && !data) return (
    <section className="score-page">
      <div className="score-error" role="alert"><p>{error}</p><Button className="blue sm" onClick={load}>Retry</Button></div>
    </section>
  );
  if (!data) return null;

  return (
    <section className="score-page" aria-labelledby="score-heading">
      <header className="score-header">
        <div>
          <h2 id="score-heading">Your score and level</h2>
          <p>Your standing reflects platform activity, completed gigs, and reliability—not follower counts.</p>
        </div>
        <Button className="line sm" loading={loading} onClick={load}>Refresh</Button>
      </header>
      {error && <div className="score-error" role="alert"><p>{error}</p><Button className="line sm" onClick={load}>Retry</Button></div>}
      <div className="score-summary">
        <div className="score-meter-wrap">
          <div className="score-meter" role="meter" aria-label={`${SCORE_NAME}: ${data.score} out of 100`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={data.score}>
            <span>{data.score}</span><small>out of 100</small>
          </div>
          <div className="score-track" aria-hidden="true"><span style={{ width: `${data.score}%` }} /></div>
          <LevelBadge level={data.level} />
        </div>
        <div className="score-facts">
          <div><span>Completed gigs</span><strong>{data.stats.completed}</strong></div>
          <div><span>Average rating</span><strong>{data.stats.ratingsCount ? `${data.stats.averageRating.toFixed(1)} / 5` : 'New'}</strong></div>
          <div><span>Reliability</span><strong>{Math.round(data.stats.reliability * 100)}%</strong></div>
        </div>
      </div>

      {data.nextLevel && (
        <section className="score-card" aria-labelledby="score-next-heading">
          <div className="score-card-heading">
            <div><h3 id="score-next-heading">Progress to {data.nextLevel.label}</h3><p>Meet each requirement to reach the next level.</p></div>
            {data.eligibleForProfessional && data.nextLevel.level === 'professional' && <Pill tone="wait">Eligible for admin approval</Pill>}
          </div>
          <ul className="score-requirements">
            {data.nextLevel.requirements.map((item) => (
              <li key={item.label}>
                <span className={item.met ? 'score-met' : 'score-unmet'} aria-hidden="true">{item.met ? '✓' : '○'}</span>
                <span>{item.label}</span><strong>{item.current} / {item.target}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="score-card" aria-labelledby="score-breakdown-heading">
        <h3 id="score-breakdown-heading">Score breakdown</h3>
        <ul className="score-breakdown">
          {data.breakdown.map((item) => (
            <li className={item.locked ? 'score-locked' : ''} key={item.key}>
              <span><strong>{STANDING_COMPONENT_LABELS[item.key] || item.label}</strong>{item.locked && <small>Unlocks later</small>}</span>
              <span>{item.locked ? '—' : `${item.points} / ${item.max}`}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="score-card" aria-labelledby="score-reviews-heading">
        <h3 id="score-reviews-heading">Recent reviews</h3>
        {data.reviews.length ? (
          <ul className="score-reviews">
            {data.reviews.map((review, index) => (
              <li key={`${review.date}-${index}`}>
                <div><strong>{review.brandName}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} <span className="sr-only">{review.rating} out of 5</span></span></div>
                <time dateTime={review.date}>{formatDate(review.date)}</time>
                {review.review && <p>{review.review}</p>}
              </li>
            ))}
          </ul>
        ) : <p className="score-muted">Completed collaborations and reviews will appear here.</p>}
      </section>

      {data.history.length > 0 && (
        <section className="score-card" aria-labelledby="score-history-heading">
          <h3 id="score-history-heading">Level history</h3>
          <ul className="score-history">{data.history.map((entry, index) => (
            <li key={`${entry.at}-${index}`}><LevelBadge level={entry.level} /><span>{entry.source === 'admin' ? 'Set by an admin' : 'Earned automatically'}</span><time dateTime={entry.at}>{formatDate(entry.at)}</time></li>
          ))}</ul>
        </section>
      )}
    </section>
  );
}
