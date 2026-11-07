import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cx } from './ui.jsx';
import Sidebar from './Sidebar.jsx';
import NotificationBell from './NotificationBell.jsx';
import { api } from '../api/client.js';

export default function DashboardLayout({ user, admin = false, stats, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collabUnread, setCollabUnread] = useState(0);
  const location = useLocation();
  const home = admin ? '/admin' : '/app';
  useEffect(() => {
    if (admin || user?.role !== 'creator') {
      setCollabUnread(0);
      return undefined;
    }
    let active = true;
    const refresh = () => api('/collaborations/unread')
      .then(({ unread }) => { if (active) setCollabUnread(unread || 0); })
      .catch((error) => console.error('Could not load collaboration request count.', error));
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => { active = false; clearInterval(interval); };
  }, [admin, user?.role, location.pathname]);
  const links = admin
    ? [
      { to: '/admin', label: 'Overview', icon: 'OV', end: true },
      {
        to: '/admin/registrations',
        label: 'Registrations',
        icon: 'RG',
        badge: stats?.unseen > 0 && <span className="count-badge">{stats.unseen} new</span>,
      },
      { to: '/admin/access-codes', label: 'Access codes', icon: 'AC' },
      { to: '/admin/resources', label: 'Resources', icon: 'RS' },
      {
        to: '/admin/opportunities',
        label: 'Opportunities',
        icon: 'OP',
        badge: (stats?.pendingGigs ?? 0) > 0 && <span className="count-badge">{stats.pendingGigs} new</span>,
      },
      { to: '/admin/options', label: 'Categories & locations', icon: 'CL' },
      { to: '/admin/training', label: 'Training', icon: 'TR' },
      { to: '/admin/collaborations', label: 'Collaborations', icon: 'CO' },
      { to: '/admin/admins', label: 'Admins', icon: 'AD' },
      { to: '/admin/notifications', label: 'Notifications', icon: 'NT' },
      { to: '/admin/creator-email', label: 'Email creators', icon: 'EM' },
    ]
    : [
      { to: '/app', label: 'Overview', icon: 'OV', end: true },
      {
        to: user?.role === 'brand' ? '/app/opportunities?view=mine' : '/app/opportunities',
        label: user?.role === 'brand' ? 'My opportunities' : 'Opportunities',
        icon: 'OP',
      },
      {
        to: '/app/creators',
        label: user?.role === 'brand' ? 'Find creators' : 'Collaborate',
        icon: 'CR',
        badge: user?.role === 'creator' && collabUnread > 0 && <span className="count-badge">{collabUnread}</span>,
      },
      ...(user?.role === 'creator' ? [{ to: '/app/resources', label: 'Resources', icon: 'RS' }] : []),
      { to: '/app/profile', label: 'Profile', icon: 'PR' },
      ...(user?.role === 'creator' ? [{ to: '/app/training', label: 'Training', icon: 'TR' }] : []),
      ...(user?.role === 'creator' ? [{ to: '/app/score', label: 'My Score', icon: 'SC' }] : []),
      { to: '/app/notifications', label: 'Notifications', icon: 'NT' },
      { to: '/app/about', label: 'About CloutLabs', icon: 'AB' },
    ];

  const closeMobileSidebar = useCallback(() => setMobileOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setMobileOpen((open) => !open), []);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, location.search, closeMobileSidebar]);

  return (
    <div className={cx(
      'dashboard-layout',
      admin ? 'admin-dashboard' : user?.role === 'brand' ? 'brand-dashboard' : 'creator-dashboard',
      collapsed && 'sidebar-collapsed',
    )}>
      <Sidebar
        admin={admin}
        home={home}
        links={links}
        user={user}
        open={mobileOpen}
        onClose={closeMobileSidebar}
        onToggleOpen={toggleMobileSidebar}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <main className="dashboard-main">
        <div className="dashboard-main-toolbar">
          <NotificationBell role={admin ? 'admin' : user?.role} />
        </div>
        {children}
      </main>
    </div>
  );
}
