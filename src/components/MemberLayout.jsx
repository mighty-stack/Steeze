import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from './ui.jsx';
import { useAuth } from '../context/Auth.jsx';
import DashboardLayout from './DashboardLayout.jsx';

export default function MemberLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
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
  const isOverview = location.pathname === '/app';
  const pageTitle = location.pathname.startsWith('/app/profile')
    ? 'Your profile'
    : location.pathname.includes('/interests')
      ? 'Gig interests'
      : location.pathname.startsWith('/app/opportunities')
        ? user?.role === 'brand' ? 'My opportunities' : 'Opportunities'
        : location.pathname.startsWith('/app/score')
          ? 'My Score'
        : 'About CloutLabs';
  return (
    <>
      <DashboardLayout user={user} onLogout={() => setConfirmingLogout(true)}>
        <div className="app-wrap">
          {!isOverview && <h1>{pageTitle}</h1>}
          {!isOverview && <p className="lede">Manage your profile and see what is available to verified members.</p>}
          <Outlet />
        </div>
      </DashboardLayout>
      {confirmingLogout && (
        <ConfirmDialog
          title="Log out?" message="You will need to log in again to access your dashboard." confirmLabel="Log out"
          danger={false} onClose={() => setConfirmingLogout(false)} onConfirm={handleLogout}
        />
      )}
    </>
  );
}
