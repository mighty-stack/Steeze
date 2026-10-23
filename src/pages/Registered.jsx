import { useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PendingNotice from '../components/PendingNotice.jsx';

export default function Registered() {
  const { state } = useLocation();
  return (
    <AuthLayout heading="Verify your email." sub="One quick click activates your account.">
      <PendingNotice code="registered" email={state?.email} emailSent={state?.emailSent} />
    </AuthLayout>
  );
}
