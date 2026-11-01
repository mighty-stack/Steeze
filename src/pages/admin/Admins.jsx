import { useEffect, useState } from 'react';
import { useAuth } from '../../context/Auth.jsx';
import { useToast } from '../../context/Toast.jsx';
import { api, ApiError } from '../../api/client.js';
import { useForm, focusFirstError } from '../../components/useForm.js';
import { TextField, PasswordField } from '../../components/fields.jsx';
import { Button, Modal, ConfirmDialog, Splash, Pill } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import { rules } from '../../lib/validation.js';
import { accountRules } from '../../lib/schemas.js';

function NewAdminModal({ onClose, onSave }) {
  const form = useForm({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const errors = {};
    const n = rules.text('Name', 2, 80)(form.values.name);
    const em = rules.email(form.values.email);
    const p = accountRules.password(form.values.password);
    if (n) errors.name = n;
    if (em) errors.email = em;
    if (p) errors.password = p;
    if (Object.keys(errors).length) { form.setErrors(errors); focusFirstError(document.querySelector('.modal')); return; }
    setBusy(true);
    try {
      await onSave({ name: form.values.name.trim(), email: form.values.email.trim(), password: form.values.password });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields || {}).length) { form.setErrors(err.fields); focusFirstError(document.querySelector('.modal')); }
      else setBanner(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add an admin" onClose={onClose} footer={<><button className="btn line" onClick={onClose} disabled={busy}>Cancel</button><Button className="primary" loading={busy} type="submit" form="new-admin-form">Create admin</Button></>}>
      <form id="new-admin-form" onSubmit={submit} noValidate className="form-grid">
        {banner && <div className="form-error">{banner}</div>}
        <TextField label="Name" {...form.bind('name')} autoFocus />
        <TextField label="Email" type="email" {...form.bind('email')} />
        <PasswordField label="Temporary password" meter {...form.bind('password')} hint="Share this with them directly. They can change it after logging in." />
      </form>
    </Modal>
  );
}

export default function Admins() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { admin, action }
  const [busyId, setBusyId] = useState('');

  const load = () => api('/admin/admins').then((d) => setItems(d.items)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const createAdmin = async (body) => {
    await api('/admin/admins', { method: 'POST', body });
    setShowNew(false);
    toast('Admin created.');
    load();
  };

  const toggleStatus = async (admin) => {
    setBusyId(admin.id);
    try {
      await api(`/admin/admins/${admin.id}/status`, { method: 'PATCH', body: { accountStatus: admin.accountStatus === 'active' ? 'deactivated' : 'active' } });
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const remove = async () => {
    await api(`/admin/admins/${confirmTarget.id}`, { method: 'DELETE' });
    setConfirmTarget(null);
    toast('Admin removed.');
    load();
  };

  return (
    <section className="adm-body">
      <div className="adm-head">
        <div><h1>Admins</h1><p>People who can access this dashboard.</p></div>
        <button className="btn primary sm" onClick={() => setShowNew(true)}>Add an admin</button>
      </div>

      {error && <div className="form-error mt-4">{error}</div>}
      {!items && !error && <Splash />}

      {items && (
        <div className="list-rows mt-5">
          {items.map((a) => (
            <div key={a.id} className="list-row">
              <div className="expand">
                <b>{a.displayName} {a.id === me.id && <span className="muted">(you)</span>}</b>
                <small>{a.email} &middot; Added {formatDate(a.createdAt)}</small>
              </div>
              <Pill tone={a.accountStatus === 'active' ? 'ok' : 'off'}>{a.accountStatus === 'active' ? 'Active' : 'Deactivated'}</Pill>
              {a.id !== me.id && (
                <div className="row-actions-inline">
                  <Button className="line sm" loading={busyId === a.id} onClick={() => toggleStatus(a)}>{a.accountStatus === 'active' ? 'Deactivate' : 'Reactivate'}</Button>
                  <button className="btn danger sm" onClick={() => setConfirmTarget(a)}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && <NewAdminModal onClose={() => setShowNew(false)} onSave={createAdmin} />}
      {confirmTarget && (
        <ConfirmDialog title={`Remove ${confirmTarget.displayName}?`} message="They will immediately lose access to the admin dashboard." confirmLabel="Remove" onClose={() => setConfirmTarget(null)} onConfirm={remove} />
      )}
    </section>
  );
}
