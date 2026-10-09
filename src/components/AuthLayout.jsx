import { Link } from 'react-router-dom';
import { Wordmark, cx } from './ui.jsx';

// Split screen used by registration, login, password reset and the pending notice.
export default function AuthLayout({ theme = 'brand', heading, sub, footnote, aside, top, children }) {
  return (
    <div className={cx('reg', theme === 'creator' && 'creator-theme')}>
      <aside>
        <div>
          <Wordmark tone={theme === 'creator' ? 'reversed' : 'mono'} />
          <h1>{heading}</h1>
          {sub && <p className="sub">{sub}</p>}
          {aside}
        </div>
        {footnote && <small>{footnote}</small>}
      </aside>
      <main>
        <div className="top">{top ?? <span>New here? <Link to="/">Back to home</Link></span>}</div>
        {children}
      </main>
    </div>
  );
}
