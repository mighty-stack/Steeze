import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { Button, Modal, Pill, Splash } from '../../components/ui.jsx';
import { TextField } from '../../components/fields.jsx';
import { formatDate } from '../../lib/format.js';

const STATUS_OPTIONS = [
  { id: 'all', label: 'All statuses' },
  { id: 'invited', label: 'Invited' },
  { id: 'active', label: 'Active' },
  { id: 'deactivated', label: 'Deactivated' },
];

function InviteStaffModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/admin/staff', { method: 'POST', body: { name: name.trim(), email: email.trim() } });
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not invite this staff member.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Invite a staff member"
      onClose={onClose}
      footer={(
        <>
          <button className="btn line" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className="primary" type="submit" form="invite-staff-form" loading={busy}>Send invite</Button>
        </>
      )}
    >
      <form id="invite-staff-form" className="form-grid" onSubmit={submit} noValidate>
        <TextField label="Full name" value={name} onChange={setName} autoFocus maxLength={80} />
        <TextField label="Email" type="email" value={email} onChange={setEmail} maxLength={120} autoComplete="email" />
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}

export default function Staff() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState('');

  const reload = async () => {
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (query.trim()) params.set('q', query.trim());
      const data = await api(`/admin/staff?${params.toString()}`);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Could not load staff members.');
    }
  };

  useEffect(() => {
    void reload();
  }, [statusFilter, query, page]);

  const toggleStatus = async (staffMember) => {
    setBusyId(staffMember.id);
    try {
      if (staffMember.status === 'active') {
        await api(`/admin/staff/${staffMember.id}/deactivate`, { method: 'POST' });
        toast('Staff member deactivated.');
      } else {
        await api(`/admin/staff/${staffMember.id}/reactivate`, { method: 'POST' });
        toast('Staff member reactivated.');
      }
      await reload();
    } catch (err) {
      toast(err.message || 'Could not update this staff member.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const resendInvite = async (staffMember) => {
    setBusyId(staffMember.id);
    try {
      await api(`/admin/staff/${staffMember.id}/invite`, { method: 'POST' });
      toast('Invite sent.');
    } catch (err) {
      toast(err.message || 'Could not resend the invite.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const submitInvite = async () => {
    setShowInvite(false);
    setPage(1);
    await reload();
    toast('Invitation sent.');
  };

  return (
    <section className="adm-body">
      <div className="adm-head">
        <div>
          <h1>Staff</h1>
          <p>Invite, track, and manage the internal staff roster.</p>
        </div>
        <div className="head-actions">
          <Button className="primary sm" onClick={() => setShowInvite(true)}>Invite staff</Button>
        </div>
      </div>

      <div className="filter-row mt-4">
        <select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }}>
          {STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <input
          className="input"
          value={query}
          placeholder="Search staff by name or email"
          onChange={(event) => { setPage(1); setQuery(event.target.value); }}
        />
      </div>

      {error && <div className="form-error mt-4" role="alert">{error}</div>}
      {!items && !error && <Splash />}

      {items && (
        <div className="reg-table mt-4">
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Open interviews</th>
                  <th>Completed</th>
                  <th>Last active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.items.map((staffMember) => (
                  <tr key={staffMember.id}>
                    <td><b>{staffMember.name}</b></td>
                    <td>{staffMember.email}</td>
                    <td>
                      <Pill tone={staffMember.status === 'active' ? 'ok' : staffMember.status === 'invited' ? 'wait' : 'off'}>
                        {staffMember.status}
                      </Pill>
                    </td>
                    <td>{staffMember.openInterviews ?? 0}</td>
                    <td>{staffMember.completedInterviews ?? 0}</td>
                    <td>{staffMember.lastActive ? formatDate(staffMember.lastActive) : 'Never'}</td>
                    <td>
                      <div className="row-actions-inline">
                        {staffMember.status === 'invited' && (
                          <Button className="line sm" loading={busyId === staffMember.id} onClick={() => resendInvite(staffMember)}>Resend invite</Button>
                        )}
                        <Button className="line sm" loading={busyId === staffMember.id} onClick={() => toggleStatus(staffMember)}>
                          {staffMember.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-empty">No staff members match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items && (
        <div className="pagination-row mt-4">
          <button type="button" className="btn line sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</button>
          <span>{items.total ? `Page ${page} of ${items.pages || 1}` : 'No results'}</span>
          <button type="button" className="btn line sm" onClick={() => setPage((value) => value + 1)} disabled={page >= (items.pages || 1)}>Next</button>
        </div>
      )}

      {showInvite && <InviteStaffModal onClose={() => setShowInvite(false)} onSaved={submitInvite} />}
    </section>
  );
}
