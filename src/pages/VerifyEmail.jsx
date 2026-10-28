import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import ApplicationReceived from '../components/ApplicationReceived.jsx';
import { Button } from '../components/ui.jsx';
import { ApiError, api } from '../api/client.js';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const started = useRef(false);
  const [busy, setBusy] = useState(Boolean(token));
  const [done, setDone] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [creatorVerified, setCreatorVerified] = useState(false);
  const [dead, setDead] = useState(!token);
  const [error, setError] = useState('');

  const verify = useCallback(async () => {
    setBusy(true);
    setError('');
    setDead(false);
    try {
      const result = await api('/auth/verify-email', { method: 'POST', body: { token } });
      setFirstName(result.firstName || '');
      setCreatorVerified(result.role === 'creator');
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_TOKEN') setDead(true);
      else setError(err instanceof ApiError ? err.message : 'Could not verify your email. Try again.');
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verify();
  }, [token, verify]);

  return (
    <AuthLayout heading="Email verification." sub="Confirming your address keeps your account secure.">
      <div className="formwrap">
        {busy ? (
          <p className="lede" role="status">Verifying your email&hellip;</p>
        ) : done ? (
          creatorVerified ? (
            <ApplicationReceived firstName={firstName} />
          ) : (
            <>
              <h2>Email verified</h2>
              <p className="lede">Your account is ready. You can now log in.</p>
            </>
          )
        ) : dead ? (
          <>
            <h2>This link has expired</h2>
            <p className="lede">Verification links work once and expire after 24 hours. Request a new link to continue.</p>
            <div className="mt-6"><Link className="btn blue" to="/resend-verification">Request a new link</Link></div>
          </>
        ) : (
          <>
            <h2>Could not verify your email</h2>
            {error && <div className="form-error" role="alert">{error}</div>}
            <div className="mt-6 grid gap-3">
              <Button className="blue" onClick={verify}>Try again</Button>
              <Link className="link" to="/resend-verification">Request a new link</Link>
            </div>
          </>
        )}
        {done && (
          <>
            <div className="mt-6"><Link className="btn blue" to="/login">Log in</Link></div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
