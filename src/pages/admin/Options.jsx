import { useState } from 'react';
import { useToast } from '../../context/Toast.jsx';
import { api, ApiError } from '../../api/client.js';
import { useAdminOptions } from '../../lib/useAdminOptions.js';
import { Button, ConfirmDialog, cx } from '../../components/ui.jsx';
import { Splash } from '../../components/ui.jsx';

const LISTS = [
  { type: 'category', label: 'Business categories', hint: 'Shown to brands when they register.' },
  { type: 'niche', label: 'Content niches', hint: 'Shown to creators when they register.' },
  { type: 'location', label: 'Locations', hint: 'Shared by both registration forms.' },
  { type: 'collabInterest', label: 'Collaboration interests', hint: 'The kinds of collaboration members can choose from.' },
  { type: 'trainingTopic', label: 'Training topics', hint: 'Topics admins can assign to training classes.' },
];

function OptionList({ type, hint, items, onChanged }) {
  const toast = useToast();
  const [adding, setAdding] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  const add = async (e) => {
    e.preventDefault();
    const label = adding.trim();
    if (label.length < 2) return;
    setError(''); setBusyId('new');
    try {
      await api('/admin/options', { method: 'POST', body: { type, label } });
      setAdding('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusyId('');
    }
  };

  const toggle = async (opt) => {
    setBusyId(opt.id);
    try {
      await api(`/admin/options/${opt.id}`, { method: 'PATCH', body: { active: !opt.active } });
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (opt) => {
    try {
      await api(`/admin/options/${opt.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Something went wrong.', 'error');
      if (err instanceof ApiError && err.code === 'IN_USE') setDeleteTarget(null);
    }
  };

  return (
    <div className="card">
      <h2>{LISTS.find((l) => l.type === type).label}</h2>
      <p className="card-lede">{hint}</p>
      <div className="list-rows">
        {items.length === 0 && <div className="list-row"><span className="muted">Nothing here yet &mdash; add one below.</span></div>}
        {items.map((opt) => (
          <div key={opt.id} className={cx('list-row', !opt.active && 'off')}>
            <div className="expand"><b>{opt.label}</b></div>
            <div className="row-actions-inline">
              <Button className="line sm" loading={busyId === opt.id} onClick={() => toggle(opt)}>{opt.active ? 'Deactivate' : 'Activate'}</Button>
              <button className="btn danger sm" onClick={() => setDeleteTarget(opt)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {error && <div className="form-error mt-3">{error}</div>}
      <form className="add-row" onSubmit={add}>
        <input className="input" placeholder="Add new&hellip;" value={adding} onChange={(e) => setAdding(e.target.value)} maxLength={80} aria-label={`Add to ${LISTS.find((l) => l.type === type).label}`} />
        <Button type="submit" className="primary sm" loading={busyId === 'new'}>Add</Button>
      </form>
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.label}"?`} message="This cannot be undone. If people have already chosen this option, deactivate it instead." confirmLabel="Delete"
          onClose={() => setDeleteTarget(null)} onConfirm={() => remove(deleteTarget)}
        />
      )}
    </div>
  );
}

export default function Options() {
  const { raw: grouped, error, reload } = useAdminOptions();

  return (
    <section className="adm-body">
      <div className="adm-head"><div><h1>Categories and locations</h1><p>Manage the dropdown values shown on the registration forms.</p></div></div>
      {error && <div className="form-error mt-4">{error}<button className="btn line sm ml-3" onClick={reload}>Try again</button></div>}
      {!grouped && !error && <Splash />}
      {grouped && (
        <div className="mt-5 grid gap-4.5">
          {LISTS.map((l) => <OptionList key={l.type} type={l.type} hint={l.hint} items={grouped[l.type]} onChanged={reload} />)}
        </div>
      )}
    </section>
  );
}
