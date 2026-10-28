import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import ApplicationReceived from '../components/ApplicationReceived.jsx';
import PendingNotice from '../components/PendingNotice.jsx';

export default function Registered() {
  const { state } = useLocation();
  if (state?.role === 'creator' && state.emailSent !== false) {
    return (
      <AuthLayout theme="creator" heading="Application received! 🎉">
        <div className="formwrap">
          <ApplicationReceived firstName={state.firstName} />
          <p className="verification-reminder">
            To activate your account, verify your email using the link we sent to <strong>{state.email}</strong>.
          </p>
          <p><Link className="link" to="/resend-verification" state={{ email: state.email }}>Resend verification email</Link></p>
        </div>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout heading="Verify your email." sub="One quick click activates your account.">
      <PendingNotice code="registered" email={state?.email} emailSent={state?.emailSent} />
    </AuthLayout>
  );
}
