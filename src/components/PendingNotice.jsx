import { Link } from 'react-router-dom';

const COPY = {
  registered: {
    tone: 'wait', icon: '\u23F3', title: 'Registration received',
    body: 'Thanks for registering. The Steeze team reviews every registration before it goes live.',
    steps: ['We check your details.', 'You get an email as soon as your account is verified.', 'Then you can log in, manage your profile and see opportunities.'],
    note: 'You cannot log in until your account is verified.',
  },
  ACCOUNT_PENDING: {
    tone: 'wait', icon: '\u23F3', title: 'Your account is under review',
    body: 'Your details are correct, but the Steeze team has not verified your registration yet.',
    steps: ['You will get an email as soon as you are verified.', 'After that, log in here as usual.'],
  },
  ACCOUNT_REJECTED: {
    tone: 'bad', icon: '!', title: 'Registration not approved',
    body: 'The Steeze team could not approve this registration.',
  },
  ACCOUNT_DEACTIVATED: {
    tone: 'off', icon: '\u2013', title: 'Account deactivated',
    body: 'This account has been deactivated. If you think this is a mistake, contact the Steeze team.',
  },
};

export default function PendingNotice({ code = 'registered', email, message, onBack }) {
  const c = COPY[code] || COPY.registered;
  return (
    <section className="notice" aria-live="polite">
      <div className={`icon ${c.tone}`} aria-hidden="true">{c.icon}</div>
      <h2>{c.title}</h2>
      <p>{c.body}</p>
      {code === 'ACCOUNT_REJECTED' && message && <p><b>{message.replace(/^Your registration was not approved\.?\s*/, '')}</b></p>}
      {c.steps && <ol>{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
      {email && code === 'registered' && <p>We sent a confirmation to <b>{email}</b>.</p>}
      {c.note && <p><b>{c.note}</b></p>}
      <div className="row-actions">
        {onBack ? <button className="btn line" onClick={onBack}>Back to login</button> : <Link className="btn ink" to="/">Back to home</Link>}
      </div>
    </section>
  );
}
