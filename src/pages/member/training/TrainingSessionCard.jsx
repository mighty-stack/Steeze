import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, download } from '../../../api/client.js';
import { useToast } from '../../../context/Toast.jsx';
import { Button, Pill } from '../../../components/ui.jsx';
import { classDateTime, externalHost, relativeClassTime } from '../../../lib/training.js';
import '../../../styles/training.css';

const PHASES = {
  live: { label: 'Live now', tone: 'ok' },
  upcoming: { label: 'Upcoming', tone: 'wait' },
  past: { label: 'Past', tone: 'off' },
  unscheduled: { label: 'Needs a date', tone: 'off' },
};

function ExternalLink({ href, children, className = 'btn line sm' }) {
  if (!href) return null;
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}<small className="training-link-host">{externalHost(href)}</small>
    </a>
  );
}

export function TrainingSessionCard({ item, detailed = false }) {
  const [going, setGoing] = useState(Boolean(item.going));
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const time = item.startsAt ? classDateTime(item.startsAt, item.endsAt) : null;
  const phase = PHASES[item.phase] || PHASES.upcoming;

  const toggleRsvp = async () => {
    const previous = going;
    setGoing(!previous);
    setBusy(true);
    try {
      const result = await api(`/training/sessions/${encodeURIComponent(item.id)}/rsvp`, {
        method: previous ? 'DELETE' : 'POST',
      });
      setGoing(Boolean(result.going));
      toast(result.going ? "You're going to this class." : 'Your RSVP was removed.');
    } catch (error) {
      setGoing(previous);
      toast(error.message || 'Could not update your RSVP.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addToCalendar = async () => {
    try {
      await download(`/training/sessions/${encodeURIComponent(item.id)}/calendar.ics`);
    } catch (error) {
      toast(error.message || 'Could not download the calendar file.', 'error');
    }
  };

  return (
    <article className={`training-session-card${item.cancelled ? ' is-cancelled' : ''}`}>
      {time && (
        <div className="training-session-date">
          <strong>{new Intl.DateTimeFormat(undefined, { day: '2-digit' }).format(new Date(item.startsAt))}</strong>
          <span>{new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(item.startsAt))}</span>
        </div>
      )}
      <div className="training-session-copy">
        <div className="training-session-heading">
          <Link to={`/app/training/classes/${encodeURIComponent(item.id)}`} className="training-session-title">{item.title}</Link>
          <Pill tone={item.cancelled ? 'bad' : phase.tone}>{item.cancelled ? 'Cancelled' : phase.label}</Pill>
          {item.topicLabel && <span className="training-topic-pill">{item.topicLabel}</span>}
        </div>
        <p className="training-session-byline">
          {item.hostName ? `Hosted by ${item.hostName}` : 'Steeze training'}
          {time && <> · <time dateTime={new Date(item.startsAt).toISOString()} title={time.title}>{time.date}, {time.range} ({time.timeZone})</time></>}
          {item.phase === 'upcoming' && <> · {relativeClassTime(item.startsAt)}</>}
        </p>
        {(detailed || item.description) && item.description && (
          <p className={`training-session-description${detailed ? ' is-detailed' : ''}`}>{item.description}</p>
        )}
        {item.cancelled && item.cancelReason && <p className="training-cancel-reason">{item.cancelReason}</p>}

        <div className="training-session-actions">
          {!item.cancelled && ['upcoming', 'live'].includes(item.phase) && item.joinUrl && (
            <ExternalLink href={item.joinUrl} className="btn primary sm">
              {item.phase === 'live' ? 'Join live class' : 'Join class'}
            </ExternalLink>
          )}
          {item.phase === 'past' && item.recordingUrl
            ? <ExternalLink href={item.recordingUrl}>Watch recording</ExternalLink>
            : item.phase === 'past' && <span className="training-recording-note">Recording coming soon</span>}
          {!item.cancelled && item.phase === 'upcoming' && (
            <Button className="line sm" loading={busy} onClick={toggleRsvp}>{going ? 'Going · Cancel RSVP' : "I'm going"}</Button>
          )}
          {['upcoming', 'live'].includes(item.phase) && (
            <Button className="line sm" onClick={addToCalendar}>Add to calendar</Button>
          )}
        </div>

        {(item.phase === 'past' || item.phase === 'upcoming') && item.resources?.length > 0 && (
          <div className="training-resources">
            <h4>Resources</h4>
            <ul>
              {item.resources.map((resource, index) => (
                <li key={`${resource.url}-${index}`}>
                  <ExternalLink href={resource.url} className="training-resource-link">
                    {resource.title}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

export function TrainingSessionSkeleton({ count = 3 }) {
  return (
    <div className="training-skeleton-list" aria-busy="true" aria-label="Loading training classes">
      {Array.from({ length: count }, (_, index) => <div className="training-skeleton-card" key={index} />)}
    </div>
  );
}

export function TrainingUpdateCard({ item }) {
  return (
    <article className="training-update-card">
      <div className="training-update-heading">
        <h3>{item.title}</h3>
        {item.pinned && <span className="training-topic-pill">Pinned</span>}
      </div>
      <p className="training-update-body">{item.body}</p>
      <time dateTime={item.publishedAt} title={new Date(item.publishedAt).toLocaleString()}>
        {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(item.publishedAt))}
      </time>
      {item.session && (
        <Link className="training-update-class" to={`/app/training/classes/${encodeURIComponent(item.session.id)}`}>
          Related class: {item.session.title}
        </Link>
      )}
    </article>
  );
}
