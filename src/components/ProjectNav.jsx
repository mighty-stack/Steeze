import { Link, NavLink } from 'react-router-dom';
import { Wordmark, cx } from './ui.jsx';
import { initial } from '../lib/format.js';

export default function ProjectNav({ user, unseen = 0, onLogout, landing = false }) {
  const admin = user?.role === 'admin';
  const member = user && !admin;
  const home = admin ? '/admin/registrations' : member ? '/app' : '/';

  return (
    <header className="site-nav">
      <Wordmark to={home} tone="reversed" brandName={landing ? 'Clout' : 'Steeze'} />
      <nav className="site-nav-links" aria-label="Primary navigation">
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
            <NavLink to="/admin/registrations" className={({ isActive }) => cx(isActive && 'active')}>
              Registrations {unseen > 0 && <span className="count-badge">{unseen} new</span>}
            </NavLink>
            <NavLink to="/admin/access-codes" className={({ isActive }) => cx(isActive && 'active')}>Access codes</NavLink>
            <NavLink to="/admin/opportunities" className={({ isActive }) => cx(isActive && 'active')}>Opportunities</NavLink>
            <NavLink to="/admin/options" className={({ isActive }) => cx(isActive && 'active')}>Categories and locations</NavLink>
            <NavLink to="/admin/admins" className={({ isActive }) => cx(isActive && 'active')}>Admins</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/app" end className={({ isActive }) => cx(isActive && 'active')}>Profile</NavLink>
            <NavLink to="/app/opportunities" className={({ isActive }) => cx(isActive && 'active')}>Opportunities</NavLink>
            <NavLink to="/app/about" className={({ isActive }) => cx(isActive && 'active')}>About Steeze</NavLink>
          </>
        )}
      </nav>
      {user && (
        <div className="site-nav-account">
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