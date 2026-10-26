import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Button, Modal, Pill } from '../../components/ui.jsx';
import { useToast } from '../../context/Toast.jsx';
import LevelBadge from '../../components/LevelBadge.jsx';
import { formatDate, fullNumber, platformLabel } from '../../lib/format.js';

const INTEREST_STATUS = {
  pending: { label: 'New interest', tone: 'wait' },
  shortlisted: { label: 'Shortlisted', tone: 'ok' },
  declined: { label: 'Not selected', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'off' },
  completed: { label: 'Completed', tone: 'ok' },
  not_completed: { label: 'Not completed', tone: 'bad' },
};
export default function BrandGigInterests() {
  const { id } = useParams();
  const [items, setItems] = useState(null);
  const [gigTitle, setGigTitle] = useState('');
  const [error, setError] = useState('');
  const [outcomeInterest, setOutcomeInterest] = useState(null);
  const [outcome, setOutcome] = useState('completed');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [savingOutcome, setSavingOutcome] = useState(false);
  const toast = useToast();
  const load = useCallback(async () => {
    setError('');
    try {
      const result = await api(`/brand/opportunities/${id}/interests`);
      setItems(result.items);
      setGigTitle(result.opportunity?.title || '');
    } catch (err) {
      setError(err.message || 'Could not load gig interests.');
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const openOutcome = (item) => {
    setOutcomeInterest(item);
    setOutcome('completed');
    setRating(5);
    setReview('');
  };

  const saveOutcome = async (event) => {
    event.preventDefault();
    if (!outcomeInterest) return;
    setSavingOutcome(true);
    try {
      await api(`/brand/interests/${outcomeInterest.id}/outcome`, {
        method: 'POST',
        body: { result: outcome, ...(outcome === 'completed' ? { rating, ...(review.trim() ? { review: review.trim() } : {}) } : {}) },
      });
      setOutcomeInterest(null);
      toast(outcome === 'completed' ? 'Gig completion and rating recorded.' : 'Gig outcome recorded.');
      await load();
    } catch (err) {
      toast(err.message || 'Could not record this gig outcome.', 'error');
    } finally {
      setSavingOutcome(false);
    }
  };

  return (
    <section className="db-dashboard" aria-labelledby="gig-interest-heading">
      <div className="db-panel-heading">
        <h2 id="gig-interest-heading">{gigTitle ? `Creator interest · ${gigTitle}` : 'Creator interest'}</h2>
        <Link className="link" to="/app/opportunities?view=mine">Back to my gigs</Link>
      </div>
      {error ? <div className="db-error" role="alert"><p>{error}</p><Button className="blue sm" onClick={load}>Retry</Button></div> : null}
      {!items && !error ? <div className="db-skeleton" aria-busy="true"><div className="db-skeleton-list" /></div> : null}
      {items?.length === 0 && <div className="db-panel"><p>No one has expressed interest in this gig yet.</p></div>}
      {items?.map((item) => (
        <article className="db-panel" key={item.id}>
          <div className="db-panel-heading">
            <div>
              <h2>{item.creator?.creatorName || 'Creator profile unavailable'}</h2>
              {item.creator?.headline && <p className="card-lede">{item.creator.headline}</p>}
            </div>
            <Pill tone={INTEREST_STATUS[item.status]?.tone || 'off'}>{INTEREST_STATUS[item.status]?.label || item.status}</Pill>
          </div>
          {item.creator && (
            <div className="db-standing-facts">
              {item.creator.level && <LevelBadge level={item.creator.level} />}
              {item.creator.score !== null && <span>Steeze Score: <strong>{item.creator.score}</strong></span>}
              <span>Completed gigs: <strong>{item.creator.completedGigs}</strong></span>
              {item.creator.averageRating !== null && <span>Average rating: <strong>{item.creator.averageRating.toFixed(1)} / 5</strong></span>}
            </div>
          )}
          <p className="db-fallback">Applied {formatDate(item.createdAt)}</p>
          {item.message && <p className="db-interest-message">{item.message}</p>}
          {item.creator && (
            <dl className="db-creator-facts">
              {item.creator.niche && <div><dt>Niche</dt><dd>{item.creator.niche}</dd></div>}
              {item.creator.location && <div><dt>Location</dt><dd>{item.creator.location}</dd></div>}
              {item.creator.skills.length > 0 && <div><dt>Skills</dt><dd>{item.creator.skills.join(', ')}</dd></div>}
              {item.creator.contentFormats.length > 0 && <div><dt>Formats</dt><dd>{item.creator.contentFormats.join(', ')}</dd></div>}
              {item.creator.languages.length > 0 && <div><dt>Languages</dt><dd>{item.creator.languages.join(', ')}</dd></div>}
              {item.creator.contentDescription && <div><dt>Content</dt><dd>{item.creator.contentDescription}</dd></div>}
              {item.creator.audienceNotes && <div><dt>Audience</dt><dd>{item.creator.audienceNotes}</dd></div>}
              <div><dt>Availability</dt><dd>{item.creator.availability}</dd></div>
              {item.creator.experienceLevel && <div><dt>Self-reported experience</dt><dd>{item.creator.experienceLevel}</dd></div>}
              {item.creator.isStudent && item.creator.institution && <div><dt>Institution</dt><dd>{item.creator.institution}</dd></div>}
            </dl>
          )}
          {item.creator?.socials?.length > 0 && (
            <div className="db-interest-subsection">
              <h3>Audience</h3>
              {item.creator.socials.map((social) => (
                <p key={social.platform}>
                  {platformLabel(social.platform)}: @{social.handle} · {fullNumber(social.followers)} followers
                  {social.engagementRate !== undefined ? ` · ${social.engagementRate}% engagement (self-reported)` : ''}
                </p>
              ))}
            </div>
          )}
          {item.creator?.portfolio?.length > 0 && (
            <div className="db-interest-subsection">
              <h3>Portfolio</h3>
              <ul className="db-portfolio-list">
                {item.creator.portfolio.map((link, index) => (
                  <li key={`${link.url}-${index}`}>
                    <a className="link" href={link.url} target="_blank" rel="noopener noreferrer nofollow">{link.title || link.host || link.url}</a>
                    {link.host && <small>{link.host}</small>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.email && <p className="db-contact-detail">Email: <a className="link" href={`mailto:${item.email}`}>{item.email}</a></p>}
          {item.status === 'shortlisted' && !item.completedAt && (
            <Button className="blue sm" onClick={() => openOutcome(item)}>Record gig outcome</Button>
          )}
        </article>
      ))}
      {outcomeInterest && (
        <Modal
          title="Record gig outcome"
          onClose={() => !savingOutcome && setOutcomeInterest(null)}
          footer={null}
        >
          <form className="standing-outcome-form" onSubmit={saveOutcome}>
            <p>Record the outcome for {outcomeInterest.creator?.creatorName || 'this creator'}.</p>
            <label className="field">
              <span>Outcome</span>
              <select className="input" value={outcome} onChange={(event) => setOutcome(event.target.value)}>
                <option value="completed">Gig completed</option>
                <option value="not_completed">Gig not completed</option>
              </select>
            </label>
            {outcome === 'completed' && (
              <>
                <fieldset className="standing-rating-options">
                  <legend>Rate the collaboration</legend>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value}>
                      <input type="radio" name="standing-rating" value={value} checked={rating === value} onChange={() => setRating(value)} />
                      <span aria-hidden="true">{value} ★</span>
                      <span className="sr-only">{value} out of 5 stars</span>
                    </label>
                  ))}
                </fieldset>
                <label className="field">
                  <span>Private review for platform standing (optional)</span>
                  <textarea className="textarea" maxLength={500} value={review} onChange={(event) => setReview(event.target.value)} />
                </label>
              </>
            )}
            <div className="standing-outcome-actions">
              <button className="btn line" type="button" disabled={savingOutcome} onClick={() => setOutcomeInterest(null)}>Cancel</button>
              <Button className="blue" type="submit" loading={savingOutcome}>Save outcome</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
