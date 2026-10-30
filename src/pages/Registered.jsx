import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import ApplicationReceived from '../components/ApplicationReceived.jsx';
import PendingNotice from '../components/PendingNotice.jsx';

export default function Registered() {
  const { state } = useLocation();
  if (state?.role === 'creator') {
    return (
      <AuthLayout theme="creator" heading="Application received! 🎉">
        <meta name="robots" content="noindex" />
        <div className="formwrap">
          <ApplicationReceived firstName={state.firstName} />
          {state.emailSent === false ? (
            <div className="form-error mt-4" role="alert">
              We received your application, but couldn't send the verification email. Use the link below to request another.
            </div>
          ) : (
            <p className="verification-reminder">
              To activate your account, verify your email using the link we sent to <strong>{state.email}</strong>.
            </p>
          )}
          <p className="mt-3"><Link className="link" to="/resend-verification" state={{ email: state.email }}>Resend verification email</Link></p>
        </div>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout heading="Verify your email." sub="One quick click activates your account.">
      <meta name="robots" content="noindex" />
      <PendingNotice code="registered" email={state?.email} emailSent={state?.emailSent} />
    </AuthLayout>
  );
}
