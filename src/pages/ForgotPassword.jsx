import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Button } from '../components/ui.jsx';
import { TextField } from '../components/fields.jsx';
import { useForm, focusFirstError } from '../components/useForm.js';
import { api, ApiError } from '../api/client.js';
import { rules } from '../lib/validation.js';

export default function ForgotPassword() {
  const form = useForm({ email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const msg = rules.email(form.values.email);
    if (msg) { form.setErrors({ email: msg }); focusFirstError(); return; }
    setBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: form.values.email.trim() } });
      setSent(true);
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <meta name="robots" content="noindex" />
      <AuthLayout heading="Reset your password." sub="Enter the email you registered with and we will send you a link.">
        <div className="formwrap">
          <h2>Forgot your password?</h2>
          {sent ? (
            <div className="mt-6 grid gap-4">
              <div className="form-ok" role="status">If an account exists for that email, a reset link is on its way. It works once and expires in 1 hour.</div>
              <Link className="btn line" to="/login">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {error && <div className="form-error" role="alert">{error}</div>}
              <TextField label="Email" type="email" {...form.bind('email')} autoComplete="email" inputMode="email" autoFocus />
              <Button type="submit" className="blue block" loading={busy}>Send reset link</Button>
              <div className="link-row"><Link className="link" to="/login">Back to login</Link></div>
            </form>
          )}
        </div>
      </AuthLayout>
    </>
  );
}
