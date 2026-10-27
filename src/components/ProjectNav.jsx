import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Wordmark, cx } from './ui.jsx';
import { initial } from '../lib/format.js';

export default function ProjectNav({ user, unseen = 0, onLogout, landing = false }) {
  const admin = user?.role === 'admin';
  const member = user && !admin;
  const dashboard = Boolean(user && !landing);
  const [navOpen, setNavOpen] = useState(false);
  const home = admin ? '/admin' : member ? '/app' : '/';

  useEffect(() => {
    if (!navOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [navOpen]);

  return (
    <header className={cx('site-nav', dashboard && 'dashboard-nav', navOpen && 'menu-open')}>
      <Wordmark to={home} tone="reversed" />
      {dashboard && (
        <button
          type="button"
          className="dashboard-menu-button"
          aria-expanded={navOpen}
          aria-controls="dashboard-sidebar"
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? 'Close menu' : 'Menu'}
        </button>
      )}
      {dashboard && navOpen && (
        <button
          type="button"
          className="dashboard-nav-backdrop"
          aria-label="Close dashboard navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <nav id={dashboard ? 'dashboard-sidebar' : undefined} className={cx('site-nav-links', dashboard && 'dashboard-nav-links')} aria-label="Primary navigation">
        {!user ? landing ? (
          <>
            <a href="#about">About</a>
            <Link to="/login">Log in</Link>
            <a className="nav-register" href="#register">Register</a>
          </>
        ) : (
          <>
            <a href="#about">About</a>
            <Link to="/login">Log in</Link>
          </>
        ) : admin ? (
          <>
            <NavLink to="/admin" end onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>Overview</NavLink>
            <NavLink to="/admin/registrations" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>
              Registrations {unseen > 0 && <span className="count-badge">{unseen} new</span>}
            </NavLink>
            <NavLink to="/admin/access-codes" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>Access codes</NavLink>
            <NavLink to="/admin/opportunities" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>Opportunities</NavLink>
            <NavLink to="/admin/options" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>Categories and locations</NavLink>
            <NavLink to="/admin/admins" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>Admins</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/app" end onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>Overview</NavLink>
            <NavLink to={user.role === 'brand' ? '/app/opportunities?view=mine' : '/app/opportunities'} onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>
              {user.role === 'brand' ? 'My opportunities' : 'Opportunities'}
            </NavLink>
            <NavLink to="/app/profile" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>Profile</NavLink>
            {user.role === 'creator' && <NavLink to="/app/score" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>My Score</NavLink>}
            <NavLink to="/app/about" onClick={() => setNavOpen(false)} className={({ isActive }) => cx(isActive && 'active')}>About Clout</NavLink>
          </>
        )}
      </nav>
      {user && (
        <div className={cx('site-nav-account', dashboard && 'dashboard-nav-account')}>
          <div className={cx('avatar', admin || user.role === 'brand' ? 'b' : 'c')} aria-hidden="true">
            {initial(user.displayName)}
          </div>
          <div className="site-nav-person">
            <b title={user.displayName}>{user.displayName}</b>
            <small>{admin ? 'Admin' : `${user.role === 'brand' ? 'Brand' : 'Creator'} · ${user.verificationStatus}`}</small>
          </div>
          <button type="button" className="btn white sm" onClick={onLogout}>Log out</button>
        </div>
      )}
    </header>
  );
}