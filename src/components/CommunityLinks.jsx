import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const FALLBACK_ITEMS = [
  { key: 'whatsapp', label: 'WhatsApp group', handle: null, url: 'https://chat.whatsapp.com/FDiK8vDbwIaCRfLE9t1JK9' },
  { key: 'instagram', label: 'Instagram', handle: '@clout_labs1999', url: 'https://www.instagram.com/clout_labs1999' },
  { key: 'tiktok', label: 'TikTok', handle: '@clout.labs', url: 'https://www.tiktok.com/@clout.labs' },
  { key: 'facebook', label: 'Facebook', handle: null, url: 'https://www.facebook.com/share/1Edt8Lzng9/' },
];

const fallbackSocials = [
  { key: 'instagram', label: 'Instagram', handle: '@clout_labs1999', url: 'https://www.instagram.com/clout_labs1999' },
  { key: 'tiktok', label: 'TikTok', handle: '@clout.labs', url: 'https://www.tiktok.com/@clout.labs' },
  { key: 'facebook', label: 'Facebook', handle: null, url: 'https://www.facebook.com/share/1Edt8Lzng9/' },
];

export default function CommunityLinks({ title = 'Follow CloutLabs', className = '' }) {
  const [items, setItems] = useState(FALLBACK_ITEMS);

  useEffect(() => {
    let active = true;
    api('/community')
      .then((data) => {
        if (!active) return;
        const next = Array.isArray(data?.items) && data.items.length ? data.items : fallbackSocials;
        setItems(next);
      })
      .catch(() => {
        if (active) setItems(fallbackSocials);
      });
    return () => {
      active = false;
    };
  }, []);

  const whatsapp = items.find((item) => item.key === 'whatsapp') || FALLBACK_ITEMS[0];
  const socials = (items.filter((item) => item.key !== 'whatsapp') || fallbackSocials);

  return (
    <div className={`community-links${className ? ` ${className}` : ''}`} style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e6e8ed' }}>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#4a5170', fontWeight: 700 }}>{title}</p>
      <div style={{ marginBottom: '0.75rem' }}>
        <a
          href={whatsapp.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#5b4bc4', color: '#fff', borderRadius: '999px', padding: '0.7rem 1rem', fontWeight: 700, textDecoration: 'none' }}
        >
          Join our WhatsApp group
        </a>
      </div>
      <div className="community-links-list" aria-label="CloutLabs social links" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.9rem' }}>
        {socials.map((social) => {
          const text = social.handle ? `${social.label} ${social.handle}` : social.label;
          return (
            <a
              key={social.key || social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              style={{ color: '#5b4bc4', textDecoration: 'none', fontWeight: 600 }}
            >
              {text}
            </a>
          );
        })}
      </div>
    </div>
  );
}
