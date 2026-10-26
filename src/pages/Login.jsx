import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PendingNotice from '../components/PendingNotice.jsx';
import { Button } from '../components/ui.jsx';
import { TextField, PasswordField } from '../components/fields.jsx';
import { useForm, focusFirstError } from '../components/useForm.js';
import { useAuth } from '../context/Auth.jsx';
import { ApiError } from '../api/client.js';
import { rules } from '../lib/validation.js';

const HOME = { admin: '/admin', brand: '/app', creator: '/app' };
const BLOCKED = ['ACCOUNT_PENDING', 'ACCOUNT_REJECTED', 'ACCOUNT_DEACTIVATED'];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const form = useForm({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};
    const emailErr = rules.email(form.values.email);
    if (emailErr) errors.email = emailErr;
    if (!form.values.password) errors.password = 'Enter your password.';
    if (Object.keys(errors).length) { form.setErrors(errors); focusFirstError(); return; }

    setBusy(true);
    try {
      const user = await login(form.values.email.trim(), form.values.password);
      const from = state?.from;
      const allowed = from && (user.role === 'admin' ? from.startsWith('/admin') : from.startsWith('/app'));
      navigate(allowed ? from : HOME[user.role], { replace: true });
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      if (BLOCKED.includes(err.code)) setBlocked(err);
      else if (err.fields && Object.keys(err.fields).length) { form.setErrors(err.fields); focusFirstError(); }
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      heading="Welcome back." sub="Log in to manage your profile and see current collaboration opportunities."
      top={<span>New here? <Link to="/register/brand">Register a brand</Link> or <Link to="/register/creator">a creator</Link></span>}
    >
      {blocked ? (
        <PendingNotice code={blocked.code} email={form.values.email} message={blocked.message} onBack={() => setBlocked(null)} />
      ) : (
        <div className="formwrap">
          <h2>Log in</h2>
          <form onSubmit={submit} noValidate>
            {error && <div className="form-error" role="alert">{error}</div>}
            <TextField label="Email" type="email" {...form.bind('email')} autoComplete="email" inputMode="email" autoFocus />
            <PasswordField label="Password" {...form.bind('password')} autoComplete="current-password" />
            <Button type="submit" className="blue block" loading={busy}>Log in</Button>
            <div className="link-row"><Link className="link" to="/forgot-password">Forgot your password?</Link></div>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
