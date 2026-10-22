import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Button } from '../components/ui.jsx';
import { TextField } from '../components/fields.jsx';
import { useForm, focusFirstError } from '../components/useForm.js';
import { ApiError, api } from '../api/client.js';
import { rules } from '../lib/validation.js';

export default function ResendVerification() {
  const location = useLocation();
  const form = useForm({ email: location.state?.email || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const emailError = rules.email(form.values.email);
    if (emailError) {
      form.setErrors({ email: emailError });
      focusFirstError();
      return;
    }
    setBusy(true);
    try {
      await api('/auth/resend-verification', {
        method: 'POST',
        body: { email: form.values.email.trim() },
      });
      setSent(true);
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      if (Object.keys(err.fields).length) {
        form.setErrors(err.fields);
        focusFirstError();
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout heading="Verify your email." sub="We can send you a fresh verification link.">
      <div className="formwrap">
        {sent ? (
          <>
            <h2>Check your inbox</h2>
            <p className="lede">If an unverified account exists for {form.values.email.trim()}, a new link is on its way.</p>
            <div className="mt-6"><Link className="btn blue" to="/login">Back to log in</Link></div>
          </>
        ) : (
          <>
            <h2>Resend verification link</h2>
            <form onSubmit={submit} noValidate>
              {error && <div className="form-error" role="alert">{error}</div>}
              <TextField label="Email" type="email" {...form.bind('email')} autoComplete="email" inputMode="email" autoFocus />
              <Button type="submit" className="blue block" loading={busy}>Send a new link</Button>
              <div className="link-row"><Link className="link" to="/login">Back to log in</Link></div>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
