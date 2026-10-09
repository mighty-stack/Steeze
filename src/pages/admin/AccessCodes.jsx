import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client.js';
import { TextAreaField, TextField, SelectField } from '../../components/fields.jsx';
import { Button, ConfirmDialog, Modal, Pill, Splash } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import { useToast } from '../../context/Toast.jsx';

const OWNER_TYPES = [
  { id: 'admin', label: 'Admin' },
  { id: 'employee', label: 'Employee' },
];

function AccessCodeForm({ accessCode, onClose, onSaved }) {
  const editing = Boolean(accessCode);
  const [ownerName, setOwnerName] = useState(accessCode?.ownerName || '');
  const [ownerType, setOwnerType] = useState(accessCode?.ownerType || 'employee');
  const [note, setNote] = useState(accessCode?.note || '');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError('');
    const body = {
      ownerName,
      ownerType,
      note,
      ...(!editing && code.trim() ? { code: code.trim() } : {}),
    };
    try {
      await api(editing ? `/admin/access-codes/${accessCode.id}` : '/admin/access-codes', {
        method: editing ? 'PATCH' : 'POST',
        body,
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields || {}).length) setErrors(err.fields);
      else setError(err.message || 'Could not save this access code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? `Edit ${accessCode.code}` : 'Create access code'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn line" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className="blue" type="submit" form="access-code-form" loading={busy}>{editing ? 'Save changes' : 'Create code'}</Button>
        </>
      )}
    >
      <form id="access-code-form" className="form-grid" onSubmit={save} noValidate>
        {editing ? (
          <div className="field">
            <label>Access code</label>
            <div className="input bg-mist">{accessCode.code}</div>
          </div>
        ) : (
          <TextField
            label="Access code" value={code} onChange={setCode} error={errors.code}
            hint="Leave blank to generate a code." optional maxLength={24}
            autoCapitalize="characters" autoCorrect="off" spellCheck="false" inputClassName="access-code"
          />
        )}
        <TextField
          label="Owner name" value={ownerName} onChange={setOwnerName}
          error={errors.ownerName} maxLength={80} autoComplete="name"
        />
        <SelectField
          label="Owner type" value={ownerType} onChange={setOwnerType}
          options={OWNER_TYPES} error={errors.ownerType}
        />
        <TextAreaField
          label="Note" value={note} onChange={setNote} error={errors.note}
          hint="Optional internal note, up to 200 characters." optional maxLength={200}
        />
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}

export default function AccessCodes() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [busyId, setBusyId] = useState('');

  const reload = useCallback(async () => {
    setError('');
    try {
      const data = await api('/admin/access-codes');
      setItems(data.items);
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const toggle = async (item) => {
    setBusyId(item.id);
    try {
      await api(`/admin/access-codes/${item.id}`, { method: 'PATCH', body: { active: !item.active } });
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId('');
    }
  };

  const remove = async () => {
    try {
      await api(`/admin/access-codes/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setDeleteError('');
      await reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Could not delete this access code.');
    }
  };

  return (
    <section className="adm-body">
      <div className="adm-head">
        <div><h1>Access codes</h1><p>Create referral codes and track the registrations they bring in.</p></div>
        <div className="head-actions">
          <Button className="blue sm" onClick={() => setEditing(true)}>Create access code</Button>
        </div>
      </div>

      {error && <div className="form-error mt-4" role="alert">{error}<button className="btn line sm ml-3" onClick={reload}>Try again</button></div>}
      {!items && !error && <Splash />}
      {items && (
        <div className="reg-table">
          <div className="scroll">
            <table>
              <thead>
                <tr><th>Code</th><th>Owner</th><th>Type</th><th>Note</th><th>Signups</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><b>{item.code}</b></td>
                    <td>{item.ownerName}</td>
                    <td>{item.ownerType === 'admin' ? 'Admin' : 'Employee'}</td>
                    <td>{item.note || '\u2013'}</td>
                    <td><Link className="link" to={`/admin/registrations?accessCode=${item.id}`}>{item.signups}</Link></td>
                    <td><Pill tone={item.active ? 'ok' : 'off'}>{item.active ? 'Active' : 'Inactive'}</Pill></td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="row-actions-inline">
                        <Button className="line sm" loading={busyId === item.id} onClick={() => toggle(item)}>{item.active ? 'Deactivate' : 'Activate'}</Button>
                        <button className="btn line sm" onClick={() => setEditing(item)}>Edit</button>
                        <button className="btn danger sm" onClick={() => { setDeleteError(''); setDeleteTarget(item); }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={8} className="table-empty">No access codes yet. Create one to let people register.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <AccessCodeForm accessCode={editing === true ? null : editing} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} />}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.code}?`}
          message="This permanently removes the access code. Codes with sign-ups cannot be deleted; deactivate them instead."
          confirmLabel="Delete" error={deleteError}
          onClose={() => { setDeleteTarget(null); setDeleteError(''); }} onConfirm={remove}
        />
      )}
    </section>
  );
}
