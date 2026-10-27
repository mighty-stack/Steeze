import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { initial } from '../lib/format.js';
import { cx, Wordmark } from './ui.jsx';

function NavigationLink({ to, label, icon, end, badge, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      aria-label={label}
      onClick={onNavigate}
      className={({ isActive }) => cx('dashboard-sidebar-link', isActive && 'on')}
    >
      <span className="dashboard-sidebar-icon" aria-hidden="true">{icon}</span>
      <span className="dashboard-sidebar-label">{label}</span>
      {badge}
    </NavLink>
  );
}

export default function DashboardLayout({ user, admin = false, stats, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const home = admin ? '/admin' : '/app';
  const displayName = user?.displayName || (admin ? 'Admin' : 'Member');
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
      { to: '/admin/options', label: 'Categories and locations', icon: 'CL' },
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

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  return (
    <div className={cx('dashboard-layout', admin && 'admin-dashboard', collapsed && 'sidebar-collapsed')}>
      <div className="dashboard-mobile-bar">
        <Wordmark to={home} tone="reversed" />
        <button
          type="button"
          className="dashboard-sidebar-toggle mobile-toggle"
          aria-expanded={mobileOpen}
          aria-controls="dashboard-sidebar"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? 'Close menu' : 'Menu'}
        </button>
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="dashboard-sidebar-backdrop"
          aria-label="Close dashboard navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        id="dashboard-sidebar"
        className={cx('rail dashboard-sidebar', mobileOpen && 'open')}
      >
        <div className="dashboard-sidebar-heading">
          <Wordmark to={home} tone="reversed" />
          <button
            type="button"
            className="dashboard-sidebar-toggle collapse-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <span aria-hidden="true">{collapsed ? '»' : '«'}</span>
          </button>
        </div>
        <nav aria-label={`${admin ? 'Admin' : user?.role === 'brand' ? 'Brand' : 'Creator'} navigation`}>
          {links.map((link) => (
            <NavigationLink
              key={link.to}
              {...link}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>
        <div className="who dashboard-sidebar-account">
          <div className="dashboard-sidebar-person">
            <div className={cx('avatar', admin || user?.role === 'brand' ? 'b' : 'c')} aria-hidden="true">
              {initial(displayName)}
            </div>
            <div className="dashboard-sidebar-identity">
              <b title={displayName}>{displayName}</b>
              <small>{admin ? 'Admin' : `${user?.role === 'brand' ? 'Brand' : 'Creator'} · ${user?.verificationStatus}`}</small>
            </div>
          </div>
          <button type="button" className="btn line sm dashboard-logout" onClick={onLogout} title="Log out">
            <span className="dashboard-logout-label">Log out</span>
            <span className="dashboard-logout-icon" aria-hidden="true">↪</span>
          </button>
        </div>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
