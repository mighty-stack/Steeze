import { FOOTER_SOCIALS } from '../lib/content.js';

export default function CommunityLinks({ title = 'Follow CloutLabs', className = '' }) {
  return (
    <div className={`community-links${className ? ` ${className}` : ''}`} style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e6e8ed' }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#4a5170', fontWeight: 700 }}>{title}</p>
      <div className="community-links-list" aria-label="CloutLabs social links" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.9rem' }}>
        {FOOTER_SOCIALS.map((social) => (
          <a key={social.label} href={social.href} target="_blank" rel="noreferrer noopener" aria-label={social.label} style={{ color: '#5b4bc4', textDecoration: 'none', fontWeight: 600 }}>
            {social.label}
          </a>
        ))}
      </div>
    </div>
  );
}
