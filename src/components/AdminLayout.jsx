import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ConfirmDialog } from './ui.jsx';
import { useAuth } from '../context/Auth.jsx';
import { api } from '../api/client.js';
import DashboardLayout from './DashboardLayout.jsx';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const refreshStats = () => api('/admin/stats').then(setStats).catch(() => {});
  useEffect(() => { refreshStats(); }, []);

  return (
    <>
      <DashboardLayout admin user={user} stats={stats} onLogout={() => setConfirmingLogout(true)}>
        <div className="adm-body">
          <Outlet context={{ refreshStats }} />
        </div>
      </DashboardLayout>
      {confirmingLogout && (
        <ConfirmDialog
          title="Log out?" message="You will need to log in again to access the admin dashboard." confirmLabel="Log out"
          danger={false} onClose={() => setConfirmingLogout(false)} onConfirm={logout}
        />
      )}
    </>
  );
}
