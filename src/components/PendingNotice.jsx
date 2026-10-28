import { Link } from 'react-router-dom';

const COPY = {
  registered: {
    tone: 'wait', icon: '\u2709', title: 'Check your inbox',
    body: 'Thanks for registering. We sent a link to verify your email address.',
    steps: ['Open the verification email we sent you.', 'Click the link to verify your email.', 'Then you can log in and use your account.'],
    note: 'The link expires after 24 hours. You cannot log in until your email is verified.',
  },
  ACCOUNT_PENDING: {
    tone: 'wait', icon: '\u2709', title: 'Verify your email',
    body: 'Your email address still needs to be verified before you can log in.',
    steps: ['Open the verification email we sent you.', 'Click its link, then log in again.'],
  },
  ACCOUNT_REJECTED: {
    tone: 'bad', icon: '!', title: 'Registration not approved',
    body: 'The CloutLabs team could not approve this registration.',
  },
  ACCOUNT_DEACTIVATED: {
    tone: 'off', icon: '\u2013', title: 'Account deactivated',
    body: 'This account has been deactivated. If you think this is a mistake, contact the CloutLabs team.',
  },
};

export default function PendingNotice({ code = 'registered', email, emailSent, message, onBack }) {
  const c = code === 'registered' && emailSent === false
    ? {
      ...COPY.registered,
      title: 'We could not send your verification email.',
      body: 'Your registration is saved, but the verification email was not accepted for delivery. Try resending the link.',
    }
    : COPY[code] || COPY.registered;
  return (
    <section className="notice" aria-live="polite">
      <div className={`icon ${c.tone}`} aria-hidden="true">{c.icon}</div>
      <h2>{c.title}</h2>
      <p>{c.body}</p>
      {code === 'ACCOUNT_REJECTED' && message && <p><b>{message.replace(/^Your registration was not approved\.?\s*/, '')}</b></p>}
      {c.steps && <ol>{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
      {email && code === 'registered' && emailSent !== false && <p>We sent a confirmation to <b>{email}</b>.</p>}
      {c.note && <p><b>{c.note}</b></p>}
      {(code === 'registered' || (code === 'ACCOUNT_PENDING' && email)) && (
        <p><Link className="link" to="/resend-verification" state={{ email }}>Resend verification email</Link></p>
      )}
      <div className="row-actions">
        {onBack ? <button className="btn line" onClick={onBack}>Back to login</button> : <Link className="btn ink" to="/">Back to home</Link>}
      </div>
    </section>
  );
}
