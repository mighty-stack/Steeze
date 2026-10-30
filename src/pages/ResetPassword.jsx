import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { Button } from '../components/ui.jsx';
import { PasswordField } from '../components/fields.jsx';
import { useForm, focusFirstError } from '../components/useForm.js';
import { api, ApiError } from '../api/client.js';
import { accountRules } from '../lib/schemas.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const form = useForm({ password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [dead, setDead] = useState(!token);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};
    const p = accountRules.password(form.values.password);
    const c = accountRules.confirm(form.values.confirm, form.values);
    if (p) errors.password = p;
    if (c) errors.confirm = c;
    if (Object.keys(errors).length) { form.setErrors(errors); focusFirstError(); return; }
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password: form.values.password } });
      setDone(true);
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      if (err.code === 'INVALID_TOKEN') setDead(true);
      else if (Object.keys(err.fields).length) { form.setErrors(err.fields); focusFirstError(); }
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <meta name="robots" content="noindex" />
      <AuthLayout heading="Choose a new password." sub="Pick something you have not used elsewhere.">
        <div className="formwrap">
          {done ? (
            <>
              <h2>Password updated</h2>
              <div className="mt-6 grid gap-4">
                <div className="form-ok" role="status">Your password has been changed and you were signed out everywhere.</div>
                <Link className="btn blue" to="/login">Log in</Link>
              </div>
            </>
          ) : dead ? (
            <>
              <h2>This link does not work</h2>
              <p className="lede">Reset links work once and expire after 1 hour. Request a new one to continue.</p>
              <div className="mt-6"><Link className="btn blue" to="/forgot-password">Request a new link</Link></div>
            </>
          ) : (
            <>
              <h2>New password</h2>
              <form onSubmit={submit} noValidate>
                {error && <div className="form-error" role="alert">{error}</div>}
                <PasswordField label="New password" meter {...form.bind('password')} hint="At least 8 characters, with a letter and a number." />
                <PasswordField label="Confirm new password" {...form.bind('confirm')} />
                <Button type="submit" className="blue block" loading={busy}>Update password</Button>
              </form>
            </>
          )}
        </div>
      </AuthLayout>
    </>
  );
}
