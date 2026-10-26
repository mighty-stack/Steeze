import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Button, Pill } from '../../components/ui.jsx';
import { formatDate, fullNumber, platformLabel } from '../../lib/format.js';

const INTEREST_STATUS = {
  pending: { label: 'New interest', tone: 'wait' },
  shortlisted: { label: 'Shortlisted', tone: 'ok' },
  declined: { label: 'Not selected', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'off' },
};

export default function BrandGigInterests() {
  const { id } = useParams();
  const [items, setItems] = useState(null);
  const [gigTitle, setGigTitle] = useState('');
  const [error, setError] = useState('');
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
        </article>
      ))}
    </section>
  );
}
