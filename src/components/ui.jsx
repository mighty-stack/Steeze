import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeSlow } from '../api/client.js';

export const cx = (...c) => c.filter(Boolean).join(' ');

export const Wordmark = ({ to = '/', tone = 'default', brandName = 'Steeze' }) => {
  const assets = {
    default: ['/steeze-icon.png', '/steeze-wordmark.png'],
    reversed: ['/steeze-icon-reversed.png', '/steeze-wordmark-reversed.png'],
    mono: ['/steeze-icon-white.png', '/steeze-wordmark-reversed.png'],
  };
  const [icon, wordmark] = assets[tone] || assets.default;
  return (
    <Link to={to} className="wordmark" aria-label={`${brandName} home`}>
      <img className="wordmark-icon" src={icon} alt="" />
      {brandName === 'Steeze' ? (
        <img className="wordmark-text" src={wordmark} alt="Steeze" />
      ) : (
        <span className="wordmark-label">{brandName}</span>
      )}
    </Link>
  );
};

export const Pill = ({ tone, children }) => <span className={cx('pill', tone)}>{children}</span>;

export const Spinner = () => <span className="spin" aria-hidden="true" />;

export const Splash = () => (
  <div className="splash" role="status" aria-label="Loading">
    <Spinner />
  </div>
);

// A button that shows progress and cannot be double-clicked while working.
export function Button({ loading, children, className, disabled, ...rest }) {
  return (
    <button className={cx('btn', className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

// Explains long waits (a sleeping free-tier server can take up to a minute to answer).
export function SlowBanner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => subscribeSlow(setSlow), []);
  if (!slow) return null;
  return (
    <div className="slow-banner" role="status">
      <Spinner /> Waking up the server. The first request can take up to a minute, then it is fast.
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide, labelledBy = 'modal-title' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    const focusable = () => el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (focusable()[0] || el).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = [...focusable()].filter((n) => !n.disabled);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal', wide && 'wide')} role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref} tabIndex={-1}>
        <h2 id={labelledBy}>{title}</h2>
        <div className="body">{children}</div>
        {footer && <div className="foot">{footer}</div>}
      </div>
    </div>
  );
}

// Confirmation for destructive actions. `requireText` makes the user type a name to proceed.
export function ConfirmDialog({ title, message, confirmLabel, requireText, danger = true, error, onConfirm, onClose }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = !requireText || typed.trim().toLowerCase() === requireText.trim().toLowerCase();
  const go = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn line" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className={danger ? 'danger-solid' : 'blue'} disabled={!ok} loading={busy} onClick={go}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="muted">{message}</p>
      {error && <div className="form-error mt-3" role="alert">{error}</div>}
      {requireText && (
        <div className="field">
          <label htmlFor="confirm-text">Type <b>{requireText}</b> to confirm</label>
          <input id="confirm-text" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </div>
      )}
    </Modal>
  );
}
