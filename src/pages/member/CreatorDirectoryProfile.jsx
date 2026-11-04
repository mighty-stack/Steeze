import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Button, Modal, Pill, Splash } from '../../components/ui.jsx';
import LevelBadge from '../../components/LevelBadge.jsx';
import { useAuth } from '../../context/Auth.jsx';
import { useToast } from '../../context/Toast.jsx';
import { platformLabel } from '../../lib/format.js';
import '../../styles/directory.css';

const PURPOSES = [
  ['joint_content', 'Joint content'],
  ['photo_video_shoot', 'Photo or video shoot'],
  ['editing_help', 'Editing help'],
  ['campaign_team', 'Campaign team'],
  ['other', 'Other'],
];

function Chips({ items }) {
  if (!items?.length) return <p className="creator-directory-muted">Not added yet.</p>;
  return <div className="creator-directory-chips">{items.map((item) => <span className="chip-static" key={item.id}>{item.label}</span>)}</div>;
}

function RequestModal({ creator, onClose }) {
  const [purpose, setPurpose] = useState('joint_content');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/collaborations', {
        method: 'POST',
        body: { to: creator.id, purpose, ...(message.trim() ? { message: message.trim() } : {}) },
      });
      toast('Collaboration request sent.');
      onClose();
    } catch (err) {
      setError(err.message || 'Could not send your request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Request to collaborate with ${creator.creatorName}`} onClose={onClose}>
      <form className="creator-directory-request-form" onSubmit={submit}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <label className="creator-directory-filter">
          <span>What would you like to collaborate on?</span>
          <select value={purpose} onChange={(event) => setPurpose(event.target.value)}>
            {PURPOSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="creator-directory-filter">
          <span>Message (optional)</span>
          <textarea maxLength={300} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
          <small>{message.length}/300 characters</small>
        </label>
        <p className="creator-directory-muted">If they accept, you’ll both see each other’s email address.</p>
        <Button className="primary" type="submit" loading={busy}>Send request</Button>
      </form>
    </Modal>
  );
}

export default function CreatorDirectoryProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [actionError, setActionError] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api(`/creators/${id}`));
    } catch (err) {
      setError(err.message || 'Could not load this creator profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const toggleDiscoverable = async (discoverable) => {
    setSavingVisibility(true);
    setActionError('');
    try {
      const result = await api('/profile/settings', { method: 'PATCH', body: { discoverable } });
      setUser(result.user);
      toast('Directory visibility updated.');
    } catch (err) {
      setActionError(err.message || 'Could not update directory visibility.');
    } finally {
      setSavingVisibility(false);
    }
  };

  if (loading) return <div className="card"><Splash /></div>;
  if (error || !data) return <div className="card creator-directory-error" role="alert"><p>{error || 'Creator profile not found.'}</p><Button className="primary" onClick={load}>Retry</Button></div>;

  const profile = data.profile;
  const achievements = data.achievements;
  const isSelf = data.isSelf;
  return (
    <div className="creator-directory-profile">
      {isSelf && <div className="creator-directory-preview-banner">
        <b>This is how others see you.</b>
        <label><input type="checkbox" checked={user.discoverable !== false} disabled={savingVisibility} onChange={(event) => toggleDiscoverable(event.target.checked)} /> List me in the directory</label>
        <Link className="link" to="/app/profile">Manage visibility</Link>
      </div>}
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      <header className="card creator-directory-profile-head">
        <div className="creator-directory-avatar creator-directory-avatar-large" aria-hidden="true">{profile.creatorName?.trim()?.[0]?.toUpperCase() || '?'}</div>
        <div className="creator-directory-profile-title">
          <h2>{profile.creatorName}</h2>
          {profile.headline && <p>{profile.headline}</p>}
          <div className="creator-directory-meta">
            <LevelBadge level={profile.level} />
            <Pill tone={profile.availability === 'available' ? 'ok' : 'off'}>{profile.availability}</Pill>
          </div>
          <p className="creator-directory-muted">{profile.location?.label} · {profile.niche?.label}</p>
          <p className="creator-directory-muted">Member since {achievements.stats.memberSince}</p>
        </div>
        {user.role === 'creator' && !isSelf && <Button className="primary" onClick={() => setRequesting(true)}>Request to collaborate</Button>}
      </header>

      <section className="card">
        <h2>Achievements</h2>
        {achievements.achievements.length ? (
          <div className="creator-directory-achievements">{achievements.achievements.map((item) => (
            <article key={item.key}><b>{item.label}</b><p>{item.description}</p></article>
          ))}</div>
        ) : <p className="creator-directory-muted">Achievements will appear as this creator completes milestones.</p>}
        <div className="creator-directory-stat-row">
          <div><b>{achievements.stats.completedGigs}</b><span>Completed gigs</span></div>
          <div><b>{achievements.stats.ratingAvg === null ? 'New' : `★ ${Number(achievements.stats.ratingAvg).toFixed(1)}`}</b><span>Rating</span></div>
          <div><b>{profile.level}</b><span>Level</span></div>
          <div><b>{achievements.stats.score}</b><span>Score</span></div>
        </div>
      </section>

      <section className="card">
        <h2>About</h2>
        <p className="creator-directory-plain-text">{profile.contentDescription}</p>
        {profile.isStudent && <Pill tone="off">Student creator</Pill>}
      </section>

      <section className="card">
        <h2>Skills</h2><Chips items={profile.skills} />
        <h2 className="creator-directory-subheading">Content formats</h2><Chips items={profile.contentFormats} />
        <h2 className="creator-directory-subheading">Languages</h2><Chips items={profile.languages} />
      </section>

      <section className="card">
        <h2>Portfolio</h2>
        {profile.portfolio.length ? <ul className="creator-directory-links">{profile.portfolio.map((item) => (
          <li key={item.url}><a href={item.url} target="_blank" rel="noopener noreferrer nofollow">{item.title || item.host} <small>{item.host}</small></a></li>
        ))}</ul> : <p className="creator-directory-muted">No portfolio links added.</p>}
      </section>

      <section className="card">
        <h2>Social accounts</h2>
        <ul className="creator-directory-socials">{profile.socials.map((social) => (
          <li key={social.platform}>
            <span>{platformLabel(social.platform)} · @{social.handle}</span>
            <span>{Number(social.followers).toLocaleString()} followers (self-reported){social.engagementRate !== null ? ` · ${social.engagementRate}% engagement (self-reported)` : ''}</span>
          </li>
        ))}</ul>
      </section>
      <button className="btn line" onClick={() => navigate('/app/creators')}>Back to creators</button>
      {requesting && <RequestModal creator={profile} onClose={() => setRequesting(false)} />}
    </div>
  );
}
