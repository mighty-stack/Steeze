import { useEffect, useState } from 'react';
import { useToast } from '../../context/Toast.jsx';
import { api, ApiError } from '../../api/client.js';
import { useForm, focusFirstError } from '../../components/useForm.js';
import { TextField, TextAreaField, SelectField } from '../../components/fields.jsx';
import { Button, Modal, ConfirmDialog, Splash, Pill } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import { rules } from '../../lib/validation.js';
import { Link } from 'react-router-dom';

const AUDIENCES = [{ id: 'both', label: 'Brands and creators' }, { id: 'brands', label: 'Brands only' }, { id: 'creators', label: 'Creators only' }];
const AUDIENCE_LABEL = Object.fromEntries(AUDIENCES.map((a) => [a.id, a.label]));
const EMPTY = { title: '', description: '', audience: 'both', published: true, closesAt: '' };

function OpportunityForm({ initial, onCancel, onSave }) {
  const form = useForm({ ...initial, closesAt: initial.closesAt ? initial.closesAt.slice(0, 10) : '' });
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const errors = {};
    const t = rules.text('Title', 3, 120)(form.values.title);
    const d = rules.longText('Description', 10, 2000)(form.values.description);
    if (t) errors.title = t;
    if (d) errors.description = d;
    if (Object.keys(errors).length) { form.setErrors(errors); focusFirstError(document.querySelector('.modal')); return; }
    setBusy(true);
    try {
      await onSave({
        title: form.values.title.trim(),
        description: form.values.description.trim(),
        audience: form.values.audience,
        published: form.values.published,
        closesAt: form.values.closesAt || null,
      });
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={initial.id ? 'Edit opportunity' : 'New opportunity'} onClose={onCancel}
      footer={<><button className="btn line" onClick={onCancel} disabled={busy}>Cancel</button><Button className="blue" loading={busy} type="submit" form="opp-form">Save</Button></>}
    >
      <form id="opp-form" onSubmit={submit} noValidate className="form-grid">
        {banner && <div className="form-error">{banner}</div>}
        <TextField label="Title" {...form.bind('title')} maxLength={120} autoFocus />
        <TextAreaField label="Description" {...form.bind('description')} maxLength={2000} />
        <SelectField label="Visible to" value={form.values.audience} onChange={(v) => form.set('audience', v)} options={AUDIENCES} placeholder="" />
        <TextField label="Closes on" type="date" optional {...form.bind('closesAt')} />
        <label className="flex gap-2.5 items-center font-medium">
          <input type="checkbox" checked={form.values.published} onChange={(e) => form.set('published', e.target.checked)} />
          Published (visible to members now)
        </label>
      </form>
    </Modal>
  );
}

export default function Opportunities() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // {} for new, object for existing, null for closed
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => api('/admin/opportunities').then((d) => setItems(d.items)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async (body) => {
    if (editing.id) await api(`/admin/opportunities/${editing.id}`, { method: 'PATCH', body });
    else await api('/admin/opportunities', { method: 'POST', body });
    setEditing(null);
    toast(editing.id ? 'Opportunity updated.' : 'Opportunity posted.');
    load();
  };

  const togglePublish = async (item) => {
    try {
      await api(`/admin/opportunities/${item.id}`, { method: 'PATCH', body: { published: !item.published } });
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const toggleClosed = async (item) => {
    try {
      await api(`/admin/opportunities/${item.id}`, { method: 'PATCH', body: { closed: !item.closed } });
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const remove = async () => {
    try {
      await api(`/admin/opportunities/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast('Opportunity deleted.');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <section className="adm-body">
      <div className="adm-head">
        <div><h1>Opportunities</h1><p>Post collaboration opportunities for verified members to see.</p></div>
        <button className="btn blue sm" onClick={() => setEditing({ ...EMPTY })}>New opportunity</button>
      </div>

      {error && <div className="form-error mt-4">{error}</div>}
      {!items && !error && <Splash />}
      {items && items.length === 0 && <div className="table-empty mt-5"><h3>Nothing posted yet</h3><p>Create one to get started.</p></div>}

      {items && items.length > 0 && (
        <div className="list-rows mt-5">
          {items.map((o) => (
            <div key={o.id} className="list-row">
              <div className="expand">
                <b>{o.title}</b>
                <small>
                  {formatDate(o.createdAt)} &middot; {AUDIENCE_LABEL[o.audience]}
                  {o.closesAt ? ` · Closes ${formatDate(o.closesAt)}` : ''}
                  {` · ${o.interestCounts?.total || 0} interested (${o.interestCounts?.pending || 0} pending)`}
                </small>
              </div>
              <Pill tone={o.isOpen ? 'ok' : 'off'}>{o.isOpen ? 'Open' : 'Closed'}</Pill>
              <div className="row-actions-inline">
                <Link className="link" to={`/admin/opportunities/${o.id}/interests`}>View interests ({o.interestCounts?.total || 0})</Link>
                <button className="btn line sm" onClick={() => toggleClosed(o)}>{o.closed ? 'Reopen' : 'Close'}</button>
                <button className="btn line sm" onClick={() => togglePublish(o)}>{o.published ? 'Unpublish' : 'Publish'}</button>
                <button className="btn line sm" onClick={() => setEditing(o)}>Edit</button>
                <button className="btn danger sm" onClick={() => setDeleteTarget(o)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <OpportunityForm initial={editing} onCancel={() => setEditing(null)} onSave={save} />}
      {deleteTarget && (
        <ConfirmDialog title={`Delete "${deleteTarget.title}"?`} message="Members will no longer see this opportunity. This cannot be undone." confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
      )}
    </section>
  );
}
