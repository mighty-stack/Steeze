import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ConfirmDialog } from './ui.jsx';
import { useAuth } from '../context/Auth.jsx';
import ProjectNav from './ProjectNav.jsx';

export default function MemberLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const isOverview = location.pathname === '/app';
  const pageTitle = location.pathname.startsWith('/app/profile')
    ? 'Your profile'
    : location.pathname.includes('/interests')
      ? 'Gig interests'
      : location.pathname.startsWith('/app/opportunities')
        ? user?.role === 'brand' ? 'My opportunities' : 'Opportunities'
        : location.pathname.startsWith('/app/score')
          ? 'My Score'
        : 'About Clout';
  return (
    <>
      <ProjectNav user={user} onLogout={() => setConfirmingLogout(true)} />
      <div className="app-wrap">
        {!isOverview && <h1>{pageTitle}</h1>}
        {!isOverview && <p className="lede">Manage your profile and see what is available to verified members.</p>}
        <Outlet />
      </div>
      {confirmingLogout && (
        <ConfirmDialog
          title="Log out?" message="You will need to log in again to access your dashboard." confirmLabel="Log out"
          danger={false} onClose={() => setConfirmingLogout(false)} onConfirm={logout}
        />
      )}
    </>
  );
}
