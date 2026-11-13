import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ConfirmDialog } from './ui.jsx';
import { useAuth } from '../context/Auth.jsx';
import DashboardLayout from './DashboardLayout.jsx';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to invalidate the server session during logout.', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <DashboardLayout user={user} home="/staff" onLogout={() => setConfirmingLogout(true)}>
        <div className="app-wrap">
          <Outlet />
        </div>
      </DashboardLayout>
      {confirmingLogout && (
        <ConfirmDialog
          title="Log out?"
          message="You will need to log in again to access your staff dashboard."
          confirmLabel="Log out"
          danger={false}
          onClose={() => setConfirmingLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
}
