import { useEffect } from 'react';
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

function PanelIcon({ expanded }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4.5v15" stroke="currentColor" strokeWidth="1.8" />
      <path d={expanded ? 'm15 9-3 3 3 3' : 'm13 9 3 3-3 3'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Sidebar({
  admin,
  home,
  links,
  user,
  open,
  onClose,
  onToggleOpen,
  onLogout,
  collapsed,
  onToggleCollapsed,
}) {
  const displayName = user?.displayName || (admin ? 'Admin' : 'Member');

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  return (
    <>
      <header className="dashboard-mobile-bar">
        <button
          type="button"
          className="dashboard-mobile-menu-toggle"
          aria-label={open ? 'Close dashboard navigation' : 'Open dashboard navigation'}
          aria-expanded={open}
          aria-controls="dashboard-sidebar"
          onClick={onToggleOpen}
        >
          <MenuIcon />
        </button>
        <Wordmark to={home} tone="reversed" />
        <div
          className={cx('avatar', 'dashboard-mobile-avatar', admin || user?.role === 'brand' ? 'b' : 'c')}
          role="img"
          aria-label={`Signed in as ${displayName}`}
          title={displayName}
        >
          {initial(displayName)}
        </div>
      </header>
      {open && (
        <button
          type="button"
          className="dashboard-sidebar-backdrop"
          aria-label="Close dashboard navigation"
          onClick={onClose}
        />
      )}
      <aside
        id="dashboard-sidebar"
        className={cx('dashboard-sidebar', open && 'open')}
        aria-label={`${admin ? 'Admin' : user?.role === 'brand' ? 'Brand' : 'Creator'} navigation`}
      >
        <div className="dashboard-sidebar-heading">
          <Wordmark to={home} tone="reversed" />
          <button
            type="button"
            className="dashboard-sidebar-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={onToggleCollapsed}
          >
            <PanelIcon expanded={!collapsed} />
          </button>
          <button
            type="button"
            className="dashboard-sidebar-toggle mobile-close-toggle"
            aria-label="Close dashboard navigation"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav>
          {links.map((link) => (
            <NavigationLink
              key={link.to}
              {...link}
              onNavigate={onClose}
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
    </>
  );
}
