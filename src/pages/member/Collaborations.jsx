import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Button, ConfirmDialog, Pill, Splash } from '../../components/ui.jsx';
import { useToast } from '../../context/Toast.jsx';
import '../../styles/directory.css';

const PURPOSE_LABELS = {
  joint_content: 'Joint content',
  photo_video_shoot: 'Photo or video shoot',
  editing_help: 'Editing help',
  campaign_team: 'Campaign team',
  other: 'Other',
};

export default function Collaborations() {
  const [box, setBox] = useState('inbox');
  const [data, setData] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [requests, blockedResult] = await Promise.all([
        api(`/collaborations?box=${box}`),
        api('/creators/blocked'),
      ]);
      setData(requests);
      setBlocked(blockedResult.items || []);
    } catch (err) {
      setError(err.message || 'Could not load collaboration requests.');
    } finally {
      setLoading(false);
    }
  }, [box, retry]);
  useEffect(() => { load(); }, [load]);

  const perform = async (item, action) => {
    setBusy(`${action}-${item.id}`);
    try {
      await api(`/collaborations/${item.id}/${action}`, { method: 'POST' });
      toast({ accept: 'Request accepted.', decline: 'Request declined.', withdraw: 'Request withdrawn.' }[action]);
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err.message || 'Could not update this request.');
    } finally {
      setBusy('');
    }
  };

  const block = async (creator) => {
    setBusy(`block-${creator.id}`);
    try {
      await api(`/creators/${creator.id}/block`, { method: 'POST' });
      toast('Creator blocked.');
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err.message || 'Could not block this creator.');
    } finally {
      setBusy('');
    }
  };

  const unblock = async (creator) => {
    setBusy(`unblock-${creator.id}`);
    try {
      await api(`/creators/${creator.id}/block`, { method: 'DELETE' });
      toast('Creator unblocked.');
      await load();
    } catch (err) {
      setError(err.message || 'Could not unblock this creator.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="creator-directory">
      <nav className="creator-directory-tabs" aria-label="Creator tools">
        <Link to="/app/creators">Discover</Link>
        <Link className="is-current" to="/app/collaborations">Requests{data?.unread > 0 && <span className="creator-directory-unread">{data.unread}</span>}</Link>
      </nav>
      <div className="creator-directory-box-tabs" role="tablist" aria-label="Requests">
        <button role="tab" aria-selected={box === 'inbox'} className={box === 'inbox' ? 'is-current' : ''} onClick={() => setBox('inbox')}>Inbox</button>
        <button role="tab" aria-selected={box === 'sent'} className={box === 'sent' ? 'is-current' : ''} onClick={() => setBox('sent')}>Sent</button>
      </div>
      {error && <div className="form-error creator-directory-inline-error" role="alert">{error}<button className="link" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>}
      {loading ? <div className="card"><Splash /></div> : (
        <div className="creator-directory-requests">
          {data?.items?.length ? data.items.map((item) => (
            <article className="card creator-directory-request-card" key={item.id}>
              <div className="creator-directory-request-top">
                <div>
                  <h2>{item.other?.creatorName || 'Creator'}</h2>
                  <p>{PURPOSE_LABELS[item.purpose] || 'Collaboration'}</p>
                </div>
                <Pill tone={item.status === 'accepted' ? 'ok' : item.status === 'pending' ? 'wait' : 'off'}>{item.status}</Pill>
              </div>
              {item.message && <p className="creator-directory-plain-text">{item.message}</p>}
              <p className="creator-directory-muted">{new Date(item.createdAt).toLocaleDateString()}</p>
              {item.status === 'accepted' && item.other?.email && (
                <p className="creator-directory-contact">Contact: <a href={`mailto:${item.other.email}`}>{item.other.email}</a></p>
              )}
              <div className="creator-directory-request-actions">
                <Link className="btn line sm" to={`/app/creators/${item.other?.id}`}>View profile</Link>
                {box === 'inbox' && item.status === 'pending' && <>
                  <Button className="primary sm" disabled={Boolean(busy)} onClick={() => setConfirm({ type: 'accept', item })}>Accept</Button>
                  <Button className="line sm" disabled={Boolean(busy)} onClick={() => setConfirm({ type: 'decline', item })}>Decline</Button>
                </>}
                {box === 'sent' && item.status === 'pending' && <Button className="line sm" loading={busy === `withdraw-${item.id}`} onClick={() => perform(item, 'withdraw')}>Withdraw</Button>}
                {item.other && <Button className="line sm" loading={busy === `block-${item.other.id}`} onClick={() => setConfirm({ type: 'block', creator: item.other })}>Block</Button>}
              </div>
            </article>
          )) : <div className="card creator-directory-empty"><h2>No {box} requests</h2><p>When you receive or send collaboration requests, they’ll appear here.</p>{box === 'sent' && <Link className="btn line" to="/app/creators">Discover creators</Link>}</div>}
        </div>
      )}
      <section className="card creator-directory-blocked-list">
        <h2>Blocked creators</h2>
        {blocked.length ? <ul>{blocked.map((creator) => (
          <li key={creator.id}><span>{creator.creatorName}</span><Button className="line sm" loading={busy === `unblock-${creator.id}`} onClick={() => unblock(creator)}>Unblock</Button></li>
        ))}</ul> : <p className="creator-directory-muted">You haven’t blocked anyone.</p>}
      </section>
      {confirm?.type === 'accept' && <ConfirmDialog
        title="Accept collaboration request?"
        message={`Accepting will share your email address with ${confirm.item.other?.creatorName || 'this creator'}. You’ll also see their email address.`}
        confirmLabel="Accept request" danger={false} onClose={() => setConfirm(null)}
        onConfirm={() => perform(confirm.item, 'accept')}
      />}
      {confirm?.type === 'decline' && <ConfirmDialog
        title="Decline collaboration request?"
        message="The sender will be notified that you declined."
        confirmLabel="Decline request" onClose={() => setConfirm(null)}
        onConfirm={() => perform(confirm.item, 'decline')}
      />}
      {confirm?.type === 'block' && <ConfirmDialog
        title={`Block ${confirm.creator.creatorName}?`}
        message="You won’t receive future requests from this creator. Any pending request between you will be cancelled."
        confirmLabel="Block creator" onClose={() => setConfirm(null)}
        onConfirm={() => block(confirm.creator)}
      />}
    </div>
  );
}
