import { useEffect, useState } from 'react';
import { api, qs } from '../../api/client.js';
import { Button, Pill, Splash } from '../../components/ui.jsx';
import '../../styles/directory.css';

const PURPOSE_LABELS = {
  joint_content: 'Joint content',
  photo_video_shoot: 'Photo or video shoot',
  editing_help: 'Editing help',
  campaign_team: 'Campaign team',
  other: 'Other',
};

export default function AdminCollaborations() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/admin/collaborations${qs({ status, page })}`)
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message || 'Could not load collaborations.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, page, retry]);

  return (
    <section className="creator-directory-admin">
      <header className="adm-head"><div><h1>Collaborations</h1><p>Read-only creator collaboration requests.</p></div></header>
      <label className="creator-directory-admin-filter"><span>Status</span>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['pending', 'accepted', 'declined', 'withdrawn'].map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
      </label>
      {error && <div className="form-error creator-directory-inline-error" role="alert">{error}<Button className="line sm" onClick={() => setRetry((value) => value + 1)}>Retry</Button></div>}
      {loading ? <div className="card"><Splash /></div> : data?.items?.length ? (
        <div className="creator-directory-admin-requests">{data.items.map((item) => (
          <article className="card" key={item.id}>
            <div className="creator-directory-request-top">
              <div><h2>{item.from.creatorName} → {item.to.creatorName}</h2><p>{PURPOSE_LABELS[item.purpose] || 'Collaboration'}</p></div>
              <Pill tone={item.status === 'accepted' ? 'ok' : item.status === 'pending' ? 'wait' : 'off'}>{item.status}</Pill>
            </div>
            {item.message && <p className="creator-directory-plain-text">{item.message}</p>}
            <small>{new Date(item.createdAt).toLocaleString()}</small>
          </article>
        ))}</div>
      ) : <div className="card creator-directory-empty"><h2>No collaboration requests</h2></div>}
      {data && data.pages > 1 && <div className="creator-directory-pagination">
        <Button className="line" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span>Page {page} of {data.pages}</span>
        <Button className="line" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>}
    </section>
  );
}
