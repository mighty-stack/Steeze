import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Button, Modal } from '../../components/ui.jsx';
import { useToast } from '../../context/Toast.jsx';

const statusOptions = ['all', 'awaiting', 'contacted', 'scheduled', 'completed', 'no_show', 'unreachable', 'withdrawn', 'waived'];

const actionLabels = {
  contact: 'Mark contacted',
  schedule: 'Schedule interview',
  reschedule: 'Reschedule interview',
  complete: 'Complete interview',
  no_show: 'Mark no-show',
  unreachable: 'Mark unreachable',
};

function statusLabel(value) {
  return String(value || 'unknown').replace(/_/g, ' ');
}

function dateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toneForStatus(status) {
  const map = {
    awaiting: 'wait',
    contacted: 'wait',
    scheduled: 'ok',
    completed: 'ok',
    no_show: 'bad',
    unreachable: 'off',
    withdrawn: 'off',
    waived: 'off',
  };
  return map[status] || 'off';
}

function StaffInterviewActionModal({ item, action, onClose, onSubmit }) {
  const [scheduledAt, setScheduledAt] = useState(dateTimeLocal(item.scheduledAt));
  const [mode, setMode] = useState(item.mode || 'video');
  const [meetingUrl, setMeetingUrl] = useState(item.meetingUrl || '');
  const [messageToCreator, setMessageToCreator] = useState(item.messageToCreator || '');
  const [outcome, setOutcome] = useState(item.outcome || 'passed');
  const [notes, setNotes] = useState(item.notes || '');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const body = {};
      if (action === 'contact') body.note = messageToCreator.trim();
      if (action === 'schedule' || action === 'reschedule') {
        body.scheduledAt = new Date(scheduledAt).toISOString();
        body.mode = mode;
        body.messageToCreator = messageToCreator.trim();
        if (meetingUrl.trim()) body.meetingUrl = meetingUrl.trim();
      }
      if (action === 'complete') {
        body.outcome = outcome;
        body.notes = notes.trim();
      }
      if (await onSubmit(item, action, body)) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={actionLabels[action]}
      onClose={onClose}
      footer={(
        <>
          <button className="btn line" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <Button className="primary sm" type="submit" form="staff-interview-action-form" loading={busy}>Save</Button>
        </>
      )}
    >
      <form id="staff-interview-action-form" onSubmit={submit} className="form-grid">
        {(action === 'schedule' || action === 'reschedule') && (
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
              <input className="input" type="url" maxLength={300} value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="https://meet.google.com/..." />
            </label>
            <label className="field">
              <span>Message to creator</span>
              <textarea className="input" rows={3} maxLength={300} value={messageToCreator} onChange={(event) => setMessageToCreator(event.target.value)} />
            </label>
          </>
        )}
        {action === 'contact' && (
          <label className="field">
            <span>Note (optional)</span>
            <textarea className="input" rows={3} maxLength={200} value={messageToCreator} onChange={(event) => setMessageToCreator(event.target.value)} />
          </label>
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
              <textarea className="input" rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </>
        )}
      </form>
    </Modal>
  );
}

export default function StaffInterviews() {
  const toast = useToast();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionItem, setActionItem] = useState(null);
  const [busyAction, setBusyAction] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ page: String(page), limit: '20' });
        if (status !== 'all') query.set('status', status);
        const data = await api(`/staff/interviews?${query}`);
        if (active) setResult(data);
      } catch (err) {
        if (active) setError(err.message || 'Could not load interviews.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [status, page]);

  const runAction = useCallback(async (item, action, payload = {}) => {
    setBusyAction(`${item.id}:${action}`);
    try {
      await api(`/staff/interviews/${item.id}/actions`, {
        method: 'POST',
        body: { action, ...payload, version: item.version },
      });
      toast(`${actionLabels[action]} saved.`);
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      if (status !== 'all') query.set('status', status);
      try {
        setResult(await api(`/staff/interviews?${query}`));
        setError('');
      } catch (refreshError) {
        toast(`Action saved, but the queue could not be refreshed: ${refreshError.message || 'try again.'}`, 'error');
      }
      return true;
    } catch (err) {
      toast(err.message || 'Could not update this interview.', 'error');
      return false;
    } finally {
      setBusyAction('');
    }
  }, [page, status, toast]);

  const actionsFor = (item) => {
    const actions = [];
    if (item.status === 'awaiting') {
      actions.push(['contact', 'Contact'], ['schedule', 'Schedule'], ['unreachable', 'Unreachable']);
    } else if (['no_show', 'unreachable'].includes(item.status)) {
      actions.push(['contact', 'Contact'], ['schedule', 'Schedule']);
    } else if (item.status === 'contacted') {
      actions.push(['schedule', 'Schedule'], ['unreachable', 'Unreachable']);
    }
    if (item.status === 'scheduled') {
      actions.push(['reschedule', 'Reschedule'], ['complete', 'Complete']);
      if (item.scheduledAt && new Date(item.scheduledAt).getTime() <= Date.now()) {
        actions.push(['no_show', 'No-show']);
      }
    }
    return actions;
  };

  return (
    <section className="db-panel">
      <div className="panel-header-row">
        <h1>My interviews</h1>
        <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{option === 'all' ? 'All statuses' : statusLabel(option)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="db-fallback">Loading interviews...</p>
      ) : error ? (
        <p className="db-fallback">{error}</p>
      ) : !result?.items?.length ? (
        <p className="db-fallback">No interviews match this filter.</p>
      ) : (
        <>
          <div className="list-table">
            {result.items.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.user?.name || 'Creator'}</strong>
                  <small>{item.user?.email || 'No email on file'}</small>
                  {item.mode && item.status === 'scheduled' && <small>{statusLabel(item.mode)}{item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}</small>}
                </div>
                <span className={`pill ${toneForStatus(item.status)}`}>{statusLabel(item.status)}</span>
                <time>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'No date set'}</time>
                <div className="row-actions-inline">
                  {actionsFor(item).map(([action, label]) => (
                    <Button
                      key={action}
                      className="line sm"
                      loading={busyAction === `${item.id}:${action}`}
                      disabled={Boolean(busyAction)}
                      type="button"
                      onClick={() => action === 'no_show' || action === 'unreachable'
                        ? runAction(item, action)
                        : setActionItem({ item, action })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pagination-row">
            <button type="button" className="btn line sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {page} of {result.pages || 1}</span>
            <button type="button" className="btn line sm" disabled={page >= (result.pages || 1)} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </>
      )}
      {actionItem && (
        <StaffInterviewActionModal
          item={actionItem.item}
          action={actionItem.action}
          onClose={() => setActionItem(null)}
          onSubmit={runAction}
        />
      )}
    </section>
  );
}
