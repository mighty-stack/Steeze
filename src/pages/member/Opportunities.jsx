import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Splash, cx } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import { useAuth } from '../../context/Auth.jsx';

export default function Opportunities() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api('/opportunities')
      .then((d) => alive && setItems(d.items))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  if (error) return <div className="card"><div className="form-error">{error}</div></div>;
  if (!items) return <div className="card"><Splash /></div>;

  return (
    <div className="card">
      <h2>Collaboration opportunities</h2>
      <p className="card-lede">Posted by the Clout team for verified members.</p>
      {items.length === 0 ? (
        <div className="empty"><h3>Nothing posted yet</h3><p>Check back soon &mdash; new opportunities appear here as the team adds them.</p></div>
      ) : (
        <div className="opps">
          {items.map((o) => (
            <article key={o.id} className={cx('opp', user.role === 'creator' && 'creators')}>
              <h3>{o.title}</h3>
              <p>{o.description}</p>
              <div className="meta">
                <span>{formatDate(o.createdAt)}</span>
                {o.audience !== 'both' && <span className="pill off">{o.audience === 'brands' ? 'For brands' : 'For creators'}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
