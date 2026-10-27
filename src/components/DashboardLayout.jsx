import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cx } from './ui.jsx';
import Sidebar from './Sidebar.jsx';

export default function DashboardLayout({ user, admin = false, stats, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const home = admin ? '/admin' : '/app';
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
      {
        to: '/admin/opportunities',
        label: 'Opportunities',
        icon: 'OP',
        badge: (stats?.pendingGigs ?? 0) > 0 && <span className="count-badge">{stats.pendingGigs} new</span>,
      },
      { to: '/admin/options', label: 'Categories & locations', icon: 'CL' },
      { to: '/admin/admins', label: 'Admins', icon: 'AD' },
    ]
    : [
      { to: '/app', label: 'Overview', icon: 'OV', end: true },
      {
        to: user?.role === 'brand' ? '/app/opportunities?view=mine' : '/app/opportunities',
        label: user?.role === 'brand' ? 'My opportunities' : 'Opportunities',
        icon: 'OP',
      },
      { to: '/app/profile', label: 'Profile', icon: 'PR' },
      ...(user?.role === 'creator' ? [{ to: '/app/score', label: 'My Score', icon: 'SC' }] : []),
      { to: '/app/about', label: 'About Clout', icon: 'AB' },
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
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
