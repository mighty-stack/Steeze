import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/Auth.jsx';
import { Button, Pill } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import { STATUS } from '../../lib/format.js';
import LevelBadge from '../../components/LevelBadge.jsx';
import { SCORE_NAME } from '../../lib/content.js';

const INTEREST_STATUS = {
  pending: { label: 'Interest sent', tone: 'wait' },
  shortlisted: { label: 'Shortlisted', tone: 'ok' },
  declined: { label: 'Not selected', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'off' },
};
const GIG_STATUS = {
  draft: { label: 'Draft', tone: 'off' },
  pending_review: { label: 'In review', tone: 'wait' },
  published: { label: 'Live', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'bad' },
  closed: { label: 'Closed', tone: 'off' },
};
const ATTENTION_STATUS = {
  new_interest: { label: 'New interest', tone: 'wait' },
  gig_rejected: { label: 'Rejected', tone: 'bad' },
  draft_not_submitted: { label: 'Draft', tone: 'off' },
  closing_soon: { label: 'Closing soon', tone: 'wait' },
};

function StatusPill({ status, map = INTEREST_STATUS }) {
  const value = map[status] || { label: status || 'Unknown', tone: 'off' };
  return <Pill tone={value.tone}>{value.label}</Pill>;
}

function DashboardSkeleton() {
  return (
    <div className="db-skeleton" aria-busy="true" aria-label="Loading dashboard">
      <div className="db-skeleton-banner" />
      <div className="db-stat-grid">{[0, 1, 2, 3].map((item) => <div className="db-skeleton-stat" key={item} />)}</div>
      <div className="db-skeleton-lists">{[0, 1].map((item) => <div className="db-skeleton-list" key={item} />)}</div>
    </div>
  );
}

function SectionFallback() {
  return <p className="db-fallback">Couldn't load this.</p>;
}

function NextTrainingClass({ item }) {
  if (!item) return null;
  const startsAt = new Date(item.startsAt);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const label = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(startsAt);
  const kindLabel = item.kind === 'webinar' ? 'webinar' : 'class';
  const destination = item.kind === 'webinar' ? `/app/webinars/${encodeURIComponent(item.id)}` : `/app/training/classes/${encodeURIComponent(item.id)}`;
  return (
    <section className="db-training-next" aria-label={`Next training ${kindLabel}`}>
      <div>
        <strong>{item.phase === 'live' ? 'Happening now' : `Your next ${kindLabel}`}</strong>
        <p>{item.title}</p>
        <time dateTime={startsAt.toISOString()} title={`Shown in ${timeZone}`}>{label} · {timeZone}</time>
      </div>
      <Link className="btn white sm" to={destination}>View {kindLabel}</Link>
    </section>
  );
}

function localDateKey(time, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date(time))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function countdownSentence(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes || !parts.length) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
}

function CountdownCard({ payload, clockOffset, loading }) {
  const campaigns = payload?.campaigns || [];
  const campaign = campaigns[0];
  const [now, setNow] = useState(() => Date.now() + clockOffset);
  const [announcementTime, setAnnouncementTime] = useState(() => Date.now() + clockOffset);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setNow(Date.now() + clockOffset);
    setAnnouncementTime(Date.now() + clockOffset);
    let timer;
    const tick = () => {
      const current = Date.now() + clockOffset;
      setNow(current);
      if (new Date(current).getSeconds() === 0) setAnnouncementTime(current);
    };
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      tick();
      if (!timer) timer = window.setInterval(tick, 1000);
    };
    const onVisibilityChange = () => (document.hidden ? stop() : start());
    window.addEventListener('focus', start);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!document.hidden) start();
    return () => {
      stop();
      window.removeEventListener('focus', start);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [clockOffset]);

  useEffect(() => {
    setDismissed(false);
  }, [campaign?.id]);

  if (loading) {
    return <div className="db-countdown-card db-countdown-loading" aria-label="Loading resumption countdown" aria-busy="true" />;
  }
  if (!campaign || dismissed) return null;

  const targetAt = new Date(campaign.targetAt);
  const remaining = Math.max(0, targetAt.getTime() - now);
  const resumed = remaining === 0;
  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
  const units = remaining >= 86_400_000
    ? [['Days', values.days], ['Hours', values.hours], ['Minutes', values.minutes], ['Seconds', values.seconds]]
    : [['Hours', values.hours], ['Minutes', values.minutes], ['Seconds', values.seconds]];
  const message = campaign.message || {};
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeZone: campaign.timezone || undefined,
  }).format(targetAt);
  const announcement = resumed
    ? "We're back today."
    : `${countdownSentence(Math.max(0, targetAt.getTime() - announcementTime))} until resumption.`;

  const dismiss = () => {
    setDismissed(true);
  };

  return (
    <section className="db-countdown-card" aria-label={`${campaign.title} countdown`}>
      <div className="db-countdown-heading">
        <div>
          <p className="db-countdown-eyebrow">{resumed ? 'Resumption day' : 'Coming up'}</p>
          <h2>{campaign.title}</h2>
          <time dateTime={targetAt.toISOString()} title={`Campaign timezone: ${campaign.timezone}`}>
            {dateLabel}
          </time>
        </div>
        <button type="button" className="btn line sm" onClick={dismiss} aria-label="Dismiss countdown until tomorrow">Dismiss</button>
      </div>
      {!resumed && (
        <div className="db-countdown-clock" aria-hidden="true">
          {units.map(([label, value]) => (
            <div className="db-countdown-unit" key={label}>
              <strong>{String(value).padStart(2, '0')}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
      <p className="sr-only">{announcement}</p>
      <div className="db-countdown-message">
        <strong>{resumed ? "We're back today" : message.title || 'Get ready for resumption'}</strong>
        <p>{message.body || 'Resumption starts today. Log in to see what’s new and get started.'}</p>
      </div>
      {resumed
        ? <Link className="btn primary sm" to="/app/opportunities">Browse opportunities</Link>
        : <Link className="db-countdown-settings" to="/app/profile">Reminder email settings</Link>}
    </section>
  );
}

function StatTile({ label, value, to, detail }) {
  return (
    <Link className="db-stat" to={to}>
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
      {detail && <small>{detail}</small>}
    </Link>
  );
}

function InterviewStatusCard({ interview }) {
  if (!interview) return null;
  const meta = {
    awaiting: { label: 'Awaiting review', tone: 'wait' },
    contacted: { label: 'Contacted', tone: 'wait' },
    scheduled: { label: 'Scheduled', tone: 'ok' },
    completed: { label: 'Completed', tone: 'ok' },
    no_show: { label: 'No-show', tone: 'bad' },
    unreachable: { label: 'Unreachable', tone: 'off' },
    withdrawn: { label: 'Withdrawn', tone: 'off' },
    waived: { label: 'Waived', tone: 'off' },
  }[interview.status] || { label: 'Interview', tone: 'off' };

  return (
    <section className="db-panel" aria-labelledby="creator-interview-heading">
      <div className="db-panel-heading">
        <h2 id="creator-interview-heading">Interview status</h2>
      </div>
      <div className="db-empty" style={{ padding: '1rem 0 0' }}>
        <Pill tone={meta.tone}>{meta.label}</Pill>
        {interview.status === 'scheduled' && interview.scheduledAt ? (
          <p style={{ marginTop: '0.75rem' }}>
            Your interview is scheduled for <strong>{formatDate(interview.scheduledAt, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            {' '}at <strong>{new Date(interview.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</strong>.
          </p>
        ) : interview.status === 'awaiting' ? (
          <p style={{ marginTop: '0.75rem' }}>We are reviewing your application and will contact you if you move to the next stage.</p>
        ) : interview.status === 'waived' ? (
          <p style={{ marginTop: '0.75rem' }}>This interview step has been waived for your application.</p>
        ) : interview.messageToCreator ? (
          <p style={{ marginTop: '0.75rem' }}>{interview.messageToCreator}</p>
        ) : null}
        {interview.status === 'scheduled' && interview.meetingUrl && (
          <a className="btn primary sm" href={interview.meetingUrl} target="_blank" rel="noreferrer" style={{ marginTop: '0.75rem' }}>Join meeting</a>
        )}
      </div>
    </section>
  );
}

function CreatorDashboard({ data, displayName }) {
  const completeness = data.profile?.completeness;
  const nextSteps = completeness?.missing || [];
  return (
    <>
      <CountdownCard
        payload={data.countdownPayload}
        clockOffset={data.countdownClockOffset}
        loading={data.countdownLoading}
      />
      <header className="db-header">
        <div>
          <h1>Welcome back, {data.profile?.displayName || displayName}</h1>
          <p className="lede">Your creator snapshot and the next steps to keep moving.</p>
          {data.profile?.cohort && <p className="db-cohort-label">Cohort: {data.profile.cohort}</p>}
        </div>
        <div className="db-header-actions">
          <Pill tone={STATUS.verified?.tone || 'ok'}>{STATUS.verified?.label || 'Verified'}</Pill>
          {data.profile?.cohort && <Pill tone="off">{data.profile.cohort}</Pill>}
          {data.standing && <Link className="db-standing-summary" to="/app/score"><LevelBadge level={data.standing.level} /><span>{SCORE_NAME}: {data.standing.score}</span></Link>}
          <Link className="btn primary sm" to="/app/opportunities">Browse opportunities</Link>
        </div>
      </header>
      <NextTrainingClass item={data.nextClass} />
      <InterviewStatusCard interview={data.interview} />

      <section aria-labelledby="creator-next-heading" className="db-section">
        <h2 id="creator-next-heading">Next steps</h2>
        {completeness ? (
          <div className="db-attention">
            <div className="db-progress-copy">
              <strong>{completeness.percent}% profile complete</strong>
              <Link className="btn line sm" to="/app/profile">Improve your profile</Link>
            </div>
            <div className="db-progress-track" role="progressbar" aria-label="Profile completeness" aria-valuenow={completeness.percent} aria-valuemin="0" aria-valuemax="100">
              <span style={{ width: `${completeness.percent}%` }} />
            </div>
            {nextSteps.length ? (
              <ul className="db-checklist">
                {nextSteps.map((item) => (
                  <li key={item.key}>
                    {/* TODO: link individual items to their profile section when those sections exist. */}
                    <Link to="/app/profile">{item.label}</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="db-good">Your profile is complete. Keep an eye out for opportunities that fit.</p>}
          </div>
        ) : data.profile ? (
          <div className="db-attention"><SectionFallback /></div>
        ) : <div className="db-attention"><SectionFallback /></div>}
      </section>

      <section aria-label="Creator statistics" className="db-stat-grid">
        {data.stats ? (
          <>
            <StatTile label="Open opportunities" value={data.stats.openOpportunities} to="/app/opportunities" />
            <StatTile label="Applications" value={data.stats.applications.total} to="/app/opportunities?view=mine" />
            <StatTile label="Pending" value={data.stats.applications.pending} to="/app/opportunities?view=mine&status=pending" />
            <StatTile label="Shortlisted" value={data.stats.applications.shortlisted} to="/app/opportunities?view=mine&status=shortlisted" />
          </>
        ) : <div className="db-stat-wide"><SectionFallback /></div>}
      </section>

      <div className="db-list-grid">
        <section className="db-panel" aria-labelledby="creator-applications-heading">
          <div className="db-panel-heading"><h2 id="creator-applications-heading">Your applications</h2><Link className="btn line sm" to="/app/opportunities?view=mine">See all</Link></div>
          {data.applications === null ? <SectionFallback /> : data.applications.length ? (
            <ul className="db-rows">
              {data.applications.map((application) => (
                <li key={application.id}>
                  {application.opportunity ? (
                    <Link className="db-row-link" to={`/app/opportunities?opportunity=${application.opportunity.id}`}>
                      <span className="db-row-title">{application.opportunity.title}</span>
                      {application.opportunity.brandName && <small>{application.opportunity.brandName}</small>}
                      <small>{formatDate(application.createdAt)}</small>
                    </Link>
                  ) : <span className="db-row-title">Opportunity no longer available</span>}
                  <StatusPill status={application.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="db-empty"><p>You haven't applied to anything yet.</p><Link className="btn primary sm" to="/app/opportunities">Browse opportunities</Link></div>
          )}
        </section>

        <section className="db-panel" aria-labelledby="creator-recommended-heading">
          <div className="db-panel-heading"><h2 id="creator-recommended-heading">Recommended for you</h2><Link className="btn line sm" to="/app/opportunities">Browse all</Link></div>
          {data.recommended === null ? <SectionFallback /> : data.recommended.length ? (
            <ul className="db-rows">
              {data.recommended.map((item) => (
                <li key={item.id}>
                  <Link className="db-row-link" to={`/app/opportunities?opportunity=${item.id}`}>
                    <span className="db-row-title">{item.title}</span>
                    <small>{item.closesAt ? `Closes ${formatDate(item.closesAt)}` : 'Open opportunity'}</small>
                  </Link>
                  <Pill tone="ok">Open</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <div className="db-empty"><p>No recommendations right now.</p><Link className="btn primary sm" to="/app/opportunities">Browse opportunities</Link></div>
          )}
        </section>
      </div>
    </>
  );
}

function BrandDashboard({ data, displayName }) {
  const stats = data.stats;
  return (
    <>
      <header className="db-header">
        <div>
          <h1>Welcome back, {data.profile?.displayName || displayName}</h1>
          <p className="lede">{data.profile?.brandName || 'Your brand'} — your collaboration dashboard.</p>
        </div>
        <div className="db-header-actions">
          <Pill tone={STATUS[data.profile?.verificationStatus]?.tone || 'ok'}>{STATUS[data.profile?.verificationStatus]?.label || 'Verified'}</Pill>
          <Link className="btn primary sm" to="/app/opportunities?view=mine&create=1">Post a gig</Link>
        </div>
      </header>

      <section aria-labelledby="brand-attention-heading" className="db-section">
        <h2 id="brand-attention-heading">Needs your attention</h2>
        {data.attention === null ? <div className="db-attention"><SectionFallback /></div> : data.attention.length ? (
          <ul className="db-attention db-attention-list">
            {data.attention.map((item, index) => (
              <li key={`${item.type}-${index}`}>
                <span className="db-attention-copy">{item.text}</span>
                <StatusPill status={item.type} map={ATTENTION_STATUS} />
                <Link className="btn line sm" to={item.link}>Review</Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="db-attention"><p>Nothing needs your attention right now.</p><Link className="btn line sm" to="/app/opportunities?view=mine">Review your gigs</Link></div>
        )}
      </section>

      <section aria-label="Brand statistics" className="db-stat-grid">
        {stats ? (
          <>
            <StatTile label="Live gigs" value={stats.gigs.live} to="/app/opportunities?view=mine&status=published" />
            <StatTile label="In review" value={stats.gigs.inReview} to="/app/opportunities?view=mine&status=pending_review" />
            <StatTile label="Draft gigs" value={stats.gigs.draft} to="/app/opportunities?view=mine&status=draft" />
            <StatTile label="New interest" value={stats.interests.new} to="/app/opportunities?view=mine&status=new" />
            <StatTile label="Total interest" value={stats.interests.total} to="/app/opportunities?view=mine" />
            <StatTile label="Shortlisted" value={stats.interests.shortlisted} to="/app/opportunities?view=mine" />
          </>
        ) : <div className="db-stat-wide"><SectionFallback /></div>}
      </section>

      <div className="db-list-grid">
        <section className="db-panel" aria-labelledby="brand-interest-heading">
          <div className="db-panel-heading"><h2 id="brand-interest-heading">New interest</h2><Link className="btn line sm" to="/app/opportunities?view=mine&status=new">See all</Link></div>
          {data.newInterests === null ? <SectionFallback /> : data.newInterests.length ? (
            <ul className="db-rows">
              {data.newInterests.map((interest) => (
                <li key={interest.id}>
                  <Link className="db-row-link" to={`/app/opportunities/${interest.opportunity.id}/interests`}>
                    <span className="db-row-title">{interest.creatorName}</span>
                    <small>{interest.opportunity.title}{interest.niche ? ` · ${interest.niche}` : ''}</small>
                    <small>{interest.totalFollowers.toLocaleString()} followers · {formatDate(interest.createdAt)}</small>
                  </Link>
                  <StatusPill status={interest.status} />
                </li>
              ))}
            </ul>
          ) : <div className="db-empty"><p>No new interest yet.</p><Link className="btn line sm" to="/app/opportunities?view=mine">Review your gigs</Link></div>}
        </section>

        <section className="db-panel" aria-labelledby="brand-gigs-heading">
          <div className="db-panel-heading"><h2 id="brand-gigs-heading">Your gigs</h2><Link className="link" to="/app/opportunities?view=mine">Manage all</Link></div>
          {data.recentGigs === null ? <SectionFallback /> : data.recentGigs.length ? (
            <ul className="db-rows">
              {data.recentGigs.map((gig) => (
                <li key={gig.id}>
                  <Link className="db-row-link" to={`/app/opportunities/${gig.id}/interests`}>
                    <span className="db-row-title">{gig.title}</span>
                    <small>{gig.interestCount} interest{gig.interestCount === 1 ? '' : 's'}{gig.closesAt ? ` · Closes ${formatDate(gig.closesAt)}` : ''}</small>
                  </Link>
                  <StatusPill status={gig.status} map={GIG_STATUS} />
                </li>
              ))}
            </ul>
          ) : <div className="db-empty"><p>No gigs yet.</p><Link className="link" to="/app/opportunities?view=mine&create=1">Post your first one</Link></div>}
        </section>
      </div>
      {/* TODO: add an announcements section when admin announcements exist. */}
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdownPayload, setCountdownPayload] = useState(null);
  const [countdownClockOffset, setCountdownClockOffset] = useState(0);
  const [countdownLoading, setCountdownLoading] = useState(true);
  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const dashboard = await api('/dashboard');
      setData({
        ...dashboard,
        countdownPayload: null,
        countdownClockOffset: 0,
        countdownLoading: dashboard.role === 'creator',
      });
      if (dashboard.role === 'creator') {
        setCountdownLoading(true);
        try {
          const response = await api('/countdowns/active');
          setCountdownPayload(response);
          setCountdownClockOffset(new Date(response.serverNow).getTime() - Date.now());
        } catch {
          setCountdownPayload(null);
        } finally {
          setCountdownLoading(false);
        }
      } else {
        setCountdownPayload(null);
        setCountdownLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  if (loading && !data) return <DashboardSkeleton />;
  if (error && !data) return (
    <div className="db-error" role="alert">
      <h1>Dashboard unavailable</h1>
      <p>{error}</p>
      <Button className="primary sm" onClick={load}>Retry</Button>
    </div>
  );
  if (!data) return <div className="db-error"><p>Dashboard data is unavailable.</p><Button className="primary sm" onClick={load}>Retry</Button></div>;

  return (
    <div className="db-dashboard" aria-busy={loading || undefined}>
      {error && <div className="db-inline-error" role="alert">{error}<button className="link" onClick={load}>Retry</button></div>}
      {data.role === 'creator'
        ? <CreatorDashboard
          data={{ ...data, countdownPayload, countdownClockOffset, countdownLoading }}
          displayName={user?.displayName || 'there'}
        />
        : <BrandDashboard data={data} displayName={user?.displayName || 'there'} />}
    </div>
  );
}
