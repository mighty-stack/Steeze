import { useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { TextAreaField, TextField } from '../../components/fields.jsx';
import { Button, ConfirmDialog } from '../../components/ui.jsx';

const LOGO = '/cloutlabs-brand-kit/cloutlabs-brand-kit/logo/cloutlabs-logo-horizontal.png';

export default function CreatorEmail() {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const send = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await api('/admin/creator-email', {
        method: 'POST',
        body: { subject: subject.trim(), message: message.trim() },
      });
      setResult(response);
      setConfirming(false);
      if (response.total === 0) {
        toast('There are no active, verified creators to email.', 'error');
      } else {
        toast(`Email sent to ${response.sent} of ${response.total} creators${response.failed ? `; ${response.failed} failed` : ''}.`, response.failed ? 'error' : undefined);
      }
    } catch (err) {
      setError(err.message || 'Could not send the creator email.');
      setFieldErrors(err.fields || {});
    } finally {
      setBusy(false);
    }
  };

  const review = (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    if (!subject.trim() || !message.trim()) {
      setFieldErrors({
        ...(!subject.trim() ? { subject: 'Enter an email subject.' } : {}),
        ...(!message.trim() ? { message: 'Enter a message.' } : {}),
      });
      return;
    }
    setConfirming(true);
  };

  return (
    <section className="admin-creator-email" aria-labelledby="creator-email-heading">
      <header className="admin-creator-email-heading">
        <div>
          <h1 id="creator-email-heading">Email creators</h1>
          <p>Send a branded email to every active, verified creator account.</p>
        </div>
      </header>

      <div className="admin-creator-email-grid">
        <form className="card admin-creator-email-form" onSubmit={review}>
          <p className="muted">Each creator receives a separate email. Addresses are not shared with other recipients.</p>
          <TextField
            label="Subject"
            value={subject}
            onChange={setSubject}
            error={fieldErrors.subject}
            maxLength={120}
            required
          />
          <TextAreaField
            label="Message"
            value={message}
            onChange={setMessage}
            error={fieldErrors.message}
            maxLength={5000}
            rows={10}
            required
            hint="Plain text; line breaks are preserved in the email."
          />
          {error && <div className="form-error" role="alert">{error}</div>}
          {result && (
            <div className={result.failed ? 'form-error' : 'admin-creator-email-success'} role="status">
              {result.sent} of {result.total} emails sent. {result.failed > 0 && `${result.failed} failed to send.`}
            </div>
          )}
          <Button type="submit" className="primary" disabled={busy || !subject.trim() || !message.trim()}>
            Review and send
          </Button>
        </form>

        <aside className="admin-creator-email-preview" aria-label="Email appearance preview">
          <span className="admin-creator-email-preview-label">CloutLabs email preview</span>
          <div className="admin-creator-email-preview-card">
            <div className="admin-creator-email-preview-brand">
              <img src={LOGO} alt="CloutLabs" />
            </div>
            <div className="admin-creator-email-preview-body">
              <h2>{subject.trim() || 'Your email subject'}</h2>
              <p>Hello Creator,</p>
              <p className="admin-creator-email-preview-message">{message.trim() || 'Your message will appear here.'}</p>
              <p>The CloutLabs Team</p>
            </div>
          </div>
          <p className="muted">The email uses CloutLabs branding and includes the official logo.</p>
        </aside>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Send email to all creators?"
          message="This sends the message below to every active, verified creator account. Each person receives a separate email. This cannot be undone."
          confirmLabel="Send to all creators"
          danger={false}
          onClose={() => { if (!busy) setConfirming(false); }}
          onConfirm={send}
        />
      )}
    </section>
  );
}
