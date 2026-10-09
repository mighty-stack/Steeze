import { useId, useState } from 'react';
import { cx } from './ui.jsx';
import { PLATFORMS } from '../lib/format.js';

function Shell({ id, label, optional, hint, error, children, as }) {
  const Label = as === 'legend' ? 'legend' : 'label';
  return (
    <div className="field">
      <Label {...(as === 'legend' ? {} : { htmlFor: id })}>
        {label}
        {optional && <span className="opt">Optional</span>}
      </Label>
      {children}
      {error ? (
        <div className="err-msg" id={`${id}-err`}>{error}</div>
      ) : (
        hint && <span className="hint" id={`${id}-hint`}>{hint}</span>
      )}
    </div>
  );
}

const describe = (id, error, hint) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function TextField({ label, name, value, onChange, error, hint, optional, type = 'text', inputClassName, ...rest }) {
  const id = useId();
  return (
    <Shell id={id} label={label} optional={optional} hint={hint} error={error}>
      <input
        id={id} name={name} type={type} value={value} className={cx('input', error && 'err', inputClassName)}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : undefined} aria-describedby={describe(id, error, hint)} {...rest}
      />
    </Shell>
  );
}

export function TextAreaField({ label, name, value, onChange, error, hint, optional, ...rest }) {
  const id = useId();
  return (
    <Shell id={id} label={label} optional={optional} hint={hint} error={error}>
      <textarea
        id={id} name={name} value={value} className={cx('textarea', error && 'err')}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : undefined} aria-describedby={describe(id, error, hint)} {...rest}
      />
    </Shell>
  );
}

export function SelectField({ label, name, value, onChange, error, hint, options, placeholder = 'Choose one', optional }) {
  const id = useId();
  return (
    <Shell id={id} label={label} optional={optional} hint={hint} error={error}>
      <select
        id={id} name={name} value={value} className={cx('select', error && 'err')}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : undefined} aria-describedby={describe(id, error, hint)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </Shell>
  );
}

const strength = (p) => [p.length >= 8, /[A-Za-z]/.test(p) && /\d/.test(p), p.length >= 12, /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;

export function PasswordField({ label, name, value, onChange, error, hint, meter, autoComplete = 'new-password' }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const score = meter ? strength(value) : 0;
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <div className="pw">
        <input
          id={id} name={name} type={show ? 'text' : 'password'} value={value} className={cx('input', error && 'err')}
          onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined} aria-describedby={describe(id, error, hint)}
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {meter && value && (
        <div className="pw-meter" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => <span key={n} className={n <= score ? 'on' : ''} />)}
        </div>
      )}
    </Shell>
  );
}

// Multi-select as toggle chips: real checkboxes underneath, so keyboard and screen readers work.
export function ChipGroup({ label, options, value, onChange, error, hint, name }) {
  const id = useId();
  const toggle = (optId) => onChange(value.includes(optId) ? value.filter((v) => v !== optId) : [...value, optId]);
  return (
    <fieldset className="field" aria-describedby={describe(id, error, hint)}>
      <legend>{label}</legend>
      <div className="chips" role="group" aria-label={label}>
        {options.map((o, i) => (
          <label key={o.id} className="chip-input">
            <input
              type="checkbox" name={name} checked={value.includes(o.id)} onChange={() => toggle(o.id)}
              aria-invalid={error && i === 0 ? 'true' : undefined}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {error ? <div className="err-msg" id={`${id}-err`}>{error}</div> : hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
    </fieldset>
  );
}

const EMPTY_SOCIAL = { platform: '', handle: '', followers: '' };

export function SocialsEditor({ value, onChange, errors }) {
  const rows = value.length ? value : [EMPTY_SOCIAL];
  const update = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const used = new Set(rows.map((r) => r.platform).filter(Boolean));
  return (
    <fieldset className="field">
      <legend>Social media accounts</legend>
      <div className="socials">
        {rows.map((row, i) => (
          <div key={i}>
            <div className="social-row">
              <div>
                <span className="cap">Platform</span>
                <select
                  className={cx('select', errors[`socials.${i}.platform`] && 'err')} value={row.platform} aria-label={`Platform for account ${i + 1}`}
                  onChange={(e) => update(i, { platform: e.target.value })}
                  aria-invalid={errors[`socials.${i}.platform`] ? 'true' : undefined}
                >
                  <option value="">Choose</option>
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value} disabled={used.has(p.value) && row.platform !== p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="handle-cell">
                <span className="cap">Handle or profile link</span>
                <input
                  className={cx('input', errors[`socials.${i}.handle`] && 'err')} value={row.handle} placeholder="@yourname"
                  aria-label={`Handle for account ${i + 1}`} autoCapitalize="none" autoCorrect="off" spellCheck="false"
                  onChange={(e) => update(i, { handle: e.target.value })}
                  aria-invalid={errors[`socials.${i}.handle`] ? 'true' : undefined}
                />
              </div>
              <div>
                <span className="cap">Followers</span>
                <input
                  className={cx('input', errors[`socials.${i}.followers`] && 'err')} value={row.followers} inputMode="numeric" placeholder="e.g. 12000"
                  aria-label={`Followers for account ${i + 1}`}
                  onChange={(e) => update(i, { followers: e.target.value.replace(/[,\s]/g, '') })}
                  aria-invalid={errors[`socials.${i}.followers`] ? 'true' : undefined}
                />
              </div>
              {rows.length > 1 ? (
                <button type="button" className="rm" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label={`Remove account ${i + 1}`}>&times;</button>
              ) : <span />}
            </div>
            {['platform', 'handle', 'followers'].map((k) => errors[`socials.${i}.${k}`] && (
              <div key={k} className="err-msg">{errors[`socials.${i}.${k}`]}</div>
            ))}
          </div>
        ))}
      </div>
      {errors.socials && <div className="err-msg">{errors.socials}</div>}
      {rows.length < PLATFORMS.length && (
        <button type="button" className="btn line sm mt-2.5" onClick={() => onChange([...rows, { ...EMPTY_SOCIAL }])}>
          + Add another account
        </button>
      )}
      <span className="hint">Follower counts are self-reported. The team may check them during review.</span>
    </fieldset>
  );
}
