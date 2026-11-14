import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { Button, Modal, Pill, Splash } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import InterviewAssignmentModal from './InterviewAssignmentModal.jsx';

const STATUS_META = {
  awaiting: { label: 'Awaiting', tone: 'wait' },
  contacted: { label: 'Contacted', tone: 'wait' },
  scheduled: { label: 'Scheduled', tone: 'ok' },
  completed: { label: 'Completed', tone: 'ok' },
  no_show: { label: 'No-show', tone: 'bad' },
  unreachable: { label: 'Unreachable', tone: 'off' },
  withdrawn: { label: 'Withdrawn', tone: 'off' },
  waived: { label: 'Waived', tone: 'off' },
};

const OUTCOME_META = {
  passed: { label: 'Passed', tone: 'ok' },
  failed: { label: 'Failed', tone: 'bad' },
  on_hold: { label: 'On hold', tone: 'wait' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(STATUS_META).map(([value, meta]) => ({ value, label: meta.label })),
];

const OUTCOME_OPTIONS = [
  { value: '', label: 'All outcomes' },
  ...Object.entries(OUTCOME_META).map(([value, meta]) => ({ value, label: meta.label })),
];

function InterviewStatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status || 'Unknown', tone: 'off' };
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

function OutcomePill({ outcome }) {
  if (!outcome) return <span className="muted">—</span>;
  const meta = OUTCOME_META[outcome] || { label: outcome, tone: 'off' };
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

function ActionModal({ item, action, onClose, onSubmit }) {
  const [scheduledAt, setScheduledAt] = useState(item?.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '');
  const [mode, setMode] = useState(item?.mode || 'video');
  const [meetingUrl, setMeetingUrl] = useState(item?.meetingUrl || '');
  const [note, setNote] = useState(item?.messageToCreator || '');
  const [outcome, setOutcome] = useState(item?.outcome || 'passed');
  const [waiveReason, setWaiveReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const body = {};
      if (action === 'contact') body.note = note.trim() || 'Bulk contacted.';
      if (action === 'schedule') {
        body.scheduledAt = scheduledAt;
        body.mode = mode;
        if (meetingUrl.trim()) body.meetingUrl = meetingUrl.trim();
        if (note.trim()) body.messageToCreator = note.trim();
      }
      if (action === 'complete') {
        body.outcome = outcome;
        if (note.trim()) body.notes = note.trim();
      }
      if (action === 'waive') {
        body.waivedReason = waiveReason.trim() || 'Waived by admin.';
      }
      if (action === 'reopen') {
        body.note = note.trim() || 'Reopened by admin.';
      }
      await onSubmit(item.id, action, body);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={{ contact: 'Mark contacted', schedule: 'Schedule interview', complete: 'Complete interview', waive: 'Waive interview', reopen: 'Reopen interview' }[action]}
      onClose={onClose}
      footer={(
        <>
          <button className="btn line" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className="primary sm" type="submit" form="interview-action-form" loading={busy}>Save</Button>
        </>
      )}
    >
      <form id="interview-action-form" onSubmit={submit} className="form-grid">
        {(action === 'schedule' || action === 'complete' || action === 'contact' || action === 'reopen' || action === 'waive') && (
          <>
            {(action === 'contact' || action === 'reopen' || action === 'waive') && (
              <label className="field">
                <span>{action === 'waive' ? 'Waive reason' : 'Note'}</span>
                <textarea
                  className="input"
                  rows={4}
                  value={action === 'waive' ? waiveReason : note}
                  onChange={(event) => (action === 'waive' ? setWaiveReason(event.target.value) : setNote(event.target.value))}
                  maxLength={action === 'waive' ? 200 : 300}
                />
              </label>
            )}
            {action === 'schedule' && (
              <>
                <label className="field">
                  <span>Scheduled at</span>
                  <input className="input" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required />
                </label>
                <label className="field">
                  <span>Mode</span>
                  <select className="input" value={mode} onChange={(event) => setMode(event.target.value)}>
                    <option value="video">Video</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="in_person">In-person</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="field">
                  <span>Meeting URL</span>
                  <input className="input" type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="https://meet.google.com/..." />
                </label>
                <label className="field">
                  <span>Message to creator</span>
                  <textarea className="input" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} />
                </label>
              </>
            )}
            {action === 'complete' && (
              <>
                <label className="field">
                  <span>Outcome</span>
                  <select className="input" value={outcome} onChange={(event) => setOutcome(event.target.value)}>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="on_hold">On hold</option>
                  </select>
                </label>
                <label className="field">
                  <span>Notes</span>
                  <textarea className="input" rows={4} value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} />
                </label>
              </>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}

export default function AdminInterviews() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [busyAction, setBusyAction] = useState('');

  const query = useMemo(() => ({
    status: statusFilter || undefined,
    outcome: outcomeFilter || undefined,
    q: q.trim() || undefined,
    sort: 'soonest',
    limit: 20,
  }), [q, statusFilter, outcomeFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, listData] = await Promise.all([
        api('/admin/interviews/summary'),
        api(`/admin/interviews${qs(query)}`),
      ]);
      setSummary(summaryData);
      setItems(listData.items || []);
    } catch (error) {
      toast(error.message || 'Could not load interviews.', 'error');
    } finally {
      setLoading(false);
    }
  }, [query, toast]);

  useEffect(() => { load(); }, [load]);

  const runAction = useCallback(async (id, action, payload) => {
    setBusyAction(`${id}:${action}`);
    try {
      await api(`/admin/interviews/${id}/actions`, {
        method: 'POST',
        body: { action, ...payload, version: payload.version },
      });
      toast({ contact: 'Creator marked as contacted.', schedule: 'Interview scheduled.', complete: 'Interview completed.', waive: 'Interview waived.', reopen: 'Interview reopened.' }[action] || 'Interview updated.');
      await load();
    } catch (error) {
      toast(error.message || 'Could not update this interview.', 'error');
    } finally {
      setBusyAction('');
    }
  }, [load, toast]);

  const actionButton = (item, action, label) => {
    const allowed = (() => {
      switch (action) {
        case 'contact': return ['awaiting', 'no_show', 'unreachable'].includes(item.status);
        case 'schedule': return ['awaiting', 'contacted', 'no_show', 'unreachable'].includes(item.status);
        case 'complete': return item.status === 'scheduled';
        case 'waive': return ['awaiting', 'contacted'].includes(item.status);
        case 'reopen': return ['no_show', 'unreachable', 'withdrawn', 'completed'].includes(item.status);
        case 'no_show': return item.status === 'scheduled';
        default: return false;
      }
    })();

    if (!allowed) return null;

    return (
      <Button
        key={`${item.id}-${action}`}
        className="line sm"
        loading={busyAction === `${item.id}:${action}`}
        type="button"
        onClick={() => (action === 'schedule' || action === 'complete' || action === 'waive' || action === 'reopen' || action === 'contact')
          ? setModal({ item, action })
          : runAction(item.id, action, { note: 'Updated by admin.' })}
      >
        {label}
      </Button>
    );
  };

  return (
    <section className="adm-body">
      <div className="adm-head">
        <div>
          <h1>Interviews</h1>
          <p>Track creator interviews from waiting list to completion.</p>
        </div>
        <div className="head-actions">
          <Button className="primary sm" onClick={() => setAssignmentOpen(true)}>Assign creators</Button>
          <Link className="btn line sm" to="/admin/registrations">Back to registrations</Link>
        </div>
      </div>

      {summary && (
        <div className="db-stat-grid">
          <div className="db-stat"><span>Awaiting</span><strong>{summary.counts?.awaiting ?? 0}</strong></div>
          <div className="db-stat"><span>Contacted</span><strong>{summary.counts?.contacted ?? 0}</strong></div>
          <div className="db-stat"><span>Scheduled</span><strong>{summary.counts?.scheduled ?? 0}</strong></div>
          <div className="db-stat"><span>Completed</span><strong>{summary.counts?.completed ?? 0}</strong></div>
          <div className="db-stat"><span>Overdue</span><strong>{summary.overdue ?? 0}</strong></div>
          <div className="db-stat"><span>No-shows</span><strong>{summary.counts?.no_show ?? 0}</strong></div>
          <div className="db-stat"><span>Not queued</span><strong>{summary.counts?.notInQueue ?? 0}</strong></div>
          <div className="db-stat"><span>Waived</span><strong>{summary.counts?.waived ?? 0}</strong></div>
          <div className="db-stat"><span>Unassigned</span><strong>{summary.counts?.unassigned ?? 0}</strong></div>
        </div>
      )}

      <div className="adm-filter-row mb-4">
        <label className="field inline-field">
          <span>Status</span>
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_OPTIONS.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="field inline-field">
          <span>Outcome</span>
          <select className="input" value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)}>
            {OUTCOME_OPTIONS.map((option) => <option key={option.value || 'all-outcome'} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="field inline-field expand-field">
          <span>Search creator</span>
          <input className="input" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name or email" />
        </label>
      </div>

      {loading && !items.length ? <Splash /> : (
        <div className="reg-table">
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Scheduled</th>
                  <th>Interviewer</th>
                  <th>Waiting</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="user-stack">
                        <strong>{item.creator?.name || item.creator?.displayName || 'Unknown creator'}</strong>
                        <small>{item.creator?.email || 'No email'}</small>
                        {item.creator?.cohort && <small>{item.creator.cohort}</small>}
                      </div>
                    </td>
                    <td><InterviewStatusPill status={item.status} /></td>
                    <td><OutcomePill outcome={item.outcome} /></td>
                    <td>
                      {item.scheduledAt ? (
                        <div className="user-stack">
                          <strong>{formatDate(item.scheduledAt, { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          <small>{new Date(item.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td>{item.interviewerName || 'Unassigned'}</td>
                    <td>{item.daysWaiting ?? 0} days</td>
                    <td>
                      <div className="row-actions-inline">
                        {actionButton(item, 'contact', 'Contact')}
                        {actionButton(item, 'schedule', 'Schedule')}
                        {actionButton(item, 'complete', 'Complete')}
                        {actionButton(item, 'no_show', 'No-show')}
                        {actionButton(item, 'waive', 'Waive')}
                        {actionButton(item, 'reopen', 'Reopen')}
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={7} className="table-empty">No interviews match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <ActionModal
          item={modal.item}
          action={modal.action}
          onClose={() => setModal(null)}
          onSubmit={async (id, action, payload) => {
            await runAction(id, action, payload);
            setModal(null);
          }}
        />
      )}
      {assignmentOpen && (
        <InterviewAssignmentModal
          onClose={() => setAssignmentOpen(false)}
          onComplete={async (result) => {
            const assigned = (result.assigned || 0) + (result.reassigned || 0);
            toast(`${assigned} interview${assigned === 1 ? '' : 's'} assigned${result.skipped?.length ? ` · ${result.skipped.length} skipped` : ''}.`);
            await load();
          }}
        />
      )}
    </section>
  );
}
