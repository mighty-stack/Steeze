import { useCallback, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { TextAreaField, TextField } from '../../components/fields.jsx';
import { Button, Modal } from '../../components/ui.jsx';

export default function AdminEmailModal({ user, onClose }) {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  const send = async (event) => {
    event.preventDefault();
    setErrors({});
    setError('');
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanSubject || !cleanMessage) {
      setErrors({
        ...(!cleanSubject ? { subject: 'Enter an email subject.' } : {}),
        ...(!cleanMessage ? { message: 'Enter a message.' } : {}),
      });
      return;
    }

    setBusy(true);
    try {
      await api(`/admin/users/${user.id}/email`, {
        method: 'POST',
        body: { subject: cleanSubject, message: cleanMessage },
      });
      toast(`Email sent to ${user.email}.`);
      onClose();
    } catch (err) {
      setErrors(err.fields || {});
      setError(err.message || 'Could not send the email. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Email ${user.displayName}`}
      onClose={close}
      footer={(
        <>
          <button type="button" className="btn line" onClick={close} disabled={busy}>Cancel</button>
          <Button type="submit" form="admin-member-email-form" className="primary" loading={busy}>Send email</Button>
        </>
      )}
    >
      <p className="muted">This message will be sent to {user.email}.</p>
      <form id="admin-member-email-form" onSubmit={send}>
        <TextField
          label="Subject"
          value={subject}
          onChange={setSubject}
          error={errors.subject}
          maxLength={120}
          required
        />
        <TextAreaField
          label="Message"
          value={message}
          onChange={setMessage}
          error={errors.message}
          maxLength={5000}
          rows={7}
          required
        />
        {error && <div className="form-error mt-3" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}
