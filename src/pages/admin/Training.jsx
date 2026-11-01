import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, download, qs } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { Button, ConfirmDialog, Modal, Pill, Splash } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import { localDateTimeToUtc, TRAINING_TIMEZONES, utcToLocalDateTime } from '../../lib/training.js';
import '../../styles/training.css';

const EMPTY_SESSION = {
  title: '',
  description: '',
  hostName: '',
  topic: '',
  date: '',
  time: '',
  timeZone: 'Africa/Lagos',
  durationMinutes: 60,
  joinUrl: '',
  recordingUrl: '',
  resources: [],
};
const EMPTY_UPDATE = { title: '', body: '', session: '', pinned: false };

function sessionForm(item) {
  const local = item.startsAt ? utcToLocalDateTime(item.startsAt, 'Africa/Lagos') : { date: '', time: '' };
  return {
    title: item.title || '',
    description: item.description || '',
    hostName: item.hostName || '',
    topic: item.topic || '',
    date: local.date,
    time: local.time,
    timeZone: 'Africa/Lagos',
    durationMinutes: item.durationMinutes || 60,
    joinUrl: item.joinUrl || '',
    recordingUrl: item.recordingUrl || '',
    resources: (item.resources || []).map((resource) => ({ ...resource })),
  };
}

function updateForm(item) {
  return {
    title: item.title || '',
    body: item.body || '',
    session: item.session?.id || '',
    pinned: Boolean(item.pinned),
  };
}

function SessionEditor({ initial, topics, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_SESSION);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState('');
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateResource = (index, key, value) => set('resources', form.resources.map((item, current) => current === index ? { ...item, [key]: value } : item));

  useEffect(() => {
    try {
      if (!form.date || !form.time) {
        setPreview('Choose a date and time to preview the schedule.');
        return;
      }
      const date = localDateTimeToUtc(form.date, form.time, form.timeZone);
      setPreview(`Members see: ${new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(date))} (${Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'})`);
    } catch (err) {
      setPreview(err.message);
    }
  }, [form.date, form.time, form.timeZone]);

  const save = async (publish) => {
    setError('');
    setBusy(publish ? 'publish' : 'save');
    let startsAt;
    try {
      if (form.date && form.time) startsAt = localDateTimeToUtc(form.date, form.time, form.timeZone);
      else if (!initial || publish) throw new Error('Choose a date and time for this class.');
      const resources = form.resources
        .filter((item) => item.title.trim() || item.url.trim())
        .map((item) => ({ title: item.title.trim(), url: item.url.trim() }));
      const payload = {
        title: form.title,
        description: form.description,
        hostName: form.hostName,
        topic: form.topic || '',
        ...(startsAt ? { startsAt } : {}),
        durationMinutes: Number(form.durationMinutes),
        joinUrl: form.joinUrl,
        recordingUrl: form.recordingUrl,
        resources,
      };
      await onSave(payload, publish);
    } catch (err) {
      setError(err.message || 'Could not save this class.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Modal title={initial ? 'Edit class' : 'Create class'} wide onClose={onClose} footer={(
      <>
        <button type="button" className="btn line" onClick={onClose} disabled={Boolean(busy)}>Cancel</button>
        {initial
          ? <Button type="button" className="primary" loading={busy === 'save'} disabled={Boolean(busy)} onClick={() => save(false)}>Save changes</Button>
          : <Button type="button" className="line" loading={busy === 'save'} disabled={Boolean(busy)} onClick={() => save(false)}>Save as draft</Button>}
        {!initial && <Button type="button" className="primary" loading={busy === 'publish'} disabled={Boolean(busy)} onClick={() => save(true)}>Publish</Button>}
        {initial?.status === 'draft' && <Button type="button" className="primary" loading={busy === 'publish'} disabled={Boolean(busy)} onClick={() => save(true)}>Save and publish</Button>}
      </>
    )}>
      <form className="training-admin-form" onSubmit={(event) => { event.preventDefault(); save(false); }}>
        <label className="field"><span>Title</span><input className="input" required minLength={3} maxLength={120} value={form.title} onChange={(event) => set('title', event.target.value)} /></label>
        <label className="field"><span>Description</span><textarea className="textarea" maxLength={2000} rows={5} value={form.description} onChange={(event) => set('description', event.target.value)} /></label>
        <div className="training-form-grid">
          <label className="field"><span>Host (optional)</span><input className="input" maxLength={80} value={form.hostName} onChange={(event) => set('hostName', event.target.value)} /></label>
          <label className="field"><span>Topic</span><select className="select" value={form.topic} onChange={(event) => set('topic', event.target.value)}><option value="">No topic</option>{topics.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
          <label className="field"><span>Duration (minutes)</span><input className="input" type="number" min={15} max={480} step={15} required value={form.durationMinutes} onChange={(event) => set('durationMinutes', event.target.value)} /></label>
          <label className="field"><span>Date</span><input className="input" type="date" value={form.date} onChange={(event) => set('date', event.target.value)} /></label>
          <label className="field"><span>Time</span><input className="input" type="time" value={form.time} onChange={(event) => set('time', event.target.value)} /></label>
          <label className="field"><span>Timezone</span><select className="select" value={form.timeZone} onChange={(event) => set('timeZone', event.target.value)}>{TRAINING_TIMEZONES.map((zone) => <option value={zone.value} key={zone.value}>{zone.label}</option>)}</select></label>
        </div>
        <p className="training-admin-time-preview" aria-live="polite">{preview}</p>
        <label className="field"><span>Join link (HTTPS)</span><input className="input" type="url" maxLength={300} value={form.joinUrl} onChange={(event) => set('joinUrl', event.target.value)} placeholder="https://meet.example.com/..." /></label>
        <label className="field"><span>Recording link (HTTPS)</span><input className="input" type="url" maxLength={300} value={form.recordingUrl} onChange={(event) => set('recordingUrl', event.target.value)} placeholder="https://youtube.com/..." /></label>
        <div className="training-resource-editor">
          <div className="training-resource-editor-heading"><strong>Resources</strong><Button type="button" className="line sm" disabled={form.resources.length >= 10} onClick={() => set('resources', [...form.resources, { title: '', url: '' }])}>Add resource</Button></div>
          {form.resources.map((resource, index) => (
            <div className="training-form-grid" key={index}>
              <label className="field"><span>Resource title</span><input className="input" maxLength={80} value={resource.title} onChange={(event) => updateResource(index, 'title', event.target.value)} /></label>
              <label className="field"><span>Resource link (HTTPS)</span><input className="input" type="url" maxLength={300} value={resource.url} onChange={(event) => updateResource(index, 'url', event.target.value)} /></label>
              <button type="button" className="link" onClick={() => set('resources', form.resources.filter((_, current) => current !== index))}>Remove</button>
            </div>
          ))}
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}

function UpdateEditor({ initial, sessions, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_UPDATE);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (publish) => {
    setError('');
    setBusy(publish ? 'publish' : 'save');
    try {
      await onSave({
        title: form.title,
        body: form.body,
        session: form.session,
        pinned: form.pinned,
      }, publish);
    } catch (err) {
      setError(err.message || 'Could not save this update.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Modal title={initial ? 'Edit update' : 'Create update'} onClose={onClose} footer={(
      <>
        <button type="button" className="btn line" onClick={onClose} disabled={Boolean(busy)}>Cancel</button>
        {initial
          ? <Button type="button" className="primary" loading={busy === 'save'} disabled={Boolean(busy)} onClick={() => save(false)}>Save changes</Button>
          : <Button type="button" className="line" loading={busy === 'save'} disabled={Boolean(busy)} onClick={() => save(false)}>Save as draft</Button>}
        {!initial && <Button type="button" className="primary" loading={busy === 'publish'} disabled={Boolean(busy)} onClick={() => save(true)}>Publish</Button>}
        {initial?.status === 'draft' && <Button type="button" className="primary" loading={busy === 'publish'} disabled={Boolean(busy)} onClick={() => save(true)}>Save and publish</Button>}
      </>
    )}>
      <form className="training-admin-form" onSubmit={(event) => { event.preventDefault(); save(false); }}>
        <label className="field"><span>Title</span><input className="input" required minLength={3} maxLength={120} value={form.title} onChange={(event) => set('title', event.target.value)} /></label>
        <label className="field"><span>Message</span><textarea className="textarea" required maxLength={1000} rows={6} value={form.body} onChange={(event) => set('body', event.target.value)} /></label>
        <label className="field"><span>Related class (optional)</span><select className="select" value={form.session} onChange={(event) => set('session', event.target.value)}><option value="">No related class</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label className="training-admin-checkbox"><input type="checkbox" checked={form.pinned} onChange={(event) => set('pinned', event.target.checked)} /> Pin this update</label>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  );
}

function Attendance({ id, onBack }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      setResult(await api(`/admin/training/sessions/${encodeURIComponent(id)}/rsvps?page=${page}&limit=50`));
    } catch (err) {
      setError(err.message || 'Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  const exportAttendance = async () => {
    setExporting(true);
    try {
      await download(`/admin/training/sessions/${encodeURIComponent(id)}/rsvps/export.csv`);
    } catch (err) {
      toast(err.message || 'Could not export attendance.', 'error');
    } finally {
      setExporting(false);
    }
  };
  useEffect(() => { load(); }, [load]);
  if (!result && !error) return <Splash />;
  return (
    <section className="adm-body">
      <div className="adm-head"><div><button className="link" onClick={onBack}>← Back to training</button><h1>{result?.session.title || 'Class attendance'}</h1><p>{result?.total || 0} RSVPs</p></div><Button className="line sm" loading={exporting} onClick={exportAttendance}>Export CSV</Button></div>
      {error && <div className="form-error mt-4" role="alert">{error}<button className="link ml-2" onClick={() => load()}>Retry</button></div>}
      {result && (
        <>
          <div className="list-rows">
            {result.items.length ? result.items.map((item) => <div className="list-row" key={item.id}><div className="expand"><b>{item.displayName}</b><small>{item.email} · {item.role} · {formatDate(item.createdAt)}</small></div></div>) : <div className="list-row">No RSVPs yet.</div>}
          </div>
          {result.pages > 1 && <div className="training-admin-pagination"><Button className="line sm" disabled={result.page <= 1 || loading} onClick={() => load(result.page - 1)}>Previous</Button><span>Page {result.page} of {result.pages}</span><Button className="line sm" disabled={result.page >= result.pages || loading} onClick={() => load(result.page + 1)}>Next</Button></div>}
        </>
      )}
    </section>
  );
}

export default function AdminTraining() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const attendanceId = searchParams.get('attendance');
  const tab = searchParams.get('tab') === 'updates' ? 'updates' : 'classes';
  const statusFilter = searchParams.get('status') || '';
  const page = Number(searchParams.get('page')) || 1;
  const [sessions, setSessions] = useState(null);
  const [sessionPages, setSessionPages] = useState(1);
  const [updates, setUpdates] = useState(null);
  const [updatePages, setUpdatePages] = useState(1);
  const [sessionOptions, setSessionOptions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [editor, setEditor] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState('');

  const setQuery = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const loadSessions = useCallback(async () => {
    setLoadError('');
    try {
      const result = await api(`/admin/training/sessions${qs({ status: statusFilter, page, limit: 20 })}`);
      setSessions(result.items);
      setSessionPages(result.pages);
    } catch (err) {
      setLoadError(err.message || 'Could not load training classes.');
    }
  }, [statusFilter, page]);

  const loadUpdates = useCallback(async () => {
    setLoadError('');
    try {
      const result = await api(`/admin/training/updates${qs({ page, limit: 20 })}`);
      setUpdates(result.items);
      setUpdatePages(result.pages);
    } catch (err) {
      setLoadError(err.message || 'Could not load training updates.');
    }
  }, [page]);

  const loadSessionOptions = useCallback(async () => {
    try {
      const result = await api('/admin/training/sessions?limit=100');
      setSessionOptions(result.items);
    } catch (err) {
      setLoadError(err.message || 'Could not load classes for related updates.');
    }
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const result = await api('/admin/options?type=trainingTopic');
      setTopics(result.items);
    } catch (err) {
      setLoadError(err.message || 'Could not load training topics.');
    }
  }, []);

  useEffect(() => { loadTopics(); }, [loadTopics]);
  useEffect(() => {
    if (tab === 'classes') loadSessions();
    else {
      loadUpdates();
      loadSessionOptions();
    }
  }, [tab, loadSessions, loadUpdates, loadSessionOptions]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (tab === 'classes') loadSessions();
      else {
        loadUpdates();
        loadSessionOptions();
      }
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [tab, loadSessions, loadUpdates, loadSessionOptions]);

  const editingSessions = useMemo(() => sessionOptions, [sessionOptions]);

  const refresh = async () => {
    if (tab === 'classes') await loadSessions();
    else await Promise.all([loadUpdates(), loadSessionOptions()]);
    await loadTopics();
  };

  const saveSession = async (id, payload, publish) => {
    if (id) {
      await api(`/admin/training/sessions/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
      if (publish) await api(`/admin/training/sessions/${encodeURIComponent(id)}/publish`, { method: 'POST' });
    } else {
      await api('/admin/training/sessions', { method: 'POST', body: { ...payload, status: publish ? 'published' : 'draft' } });
    }
    setEditor(null);
    toast(publish ? 'Class published.' : 'Class saved.');
    await loadSessions();
  };

  const saveUpdate = async (id, payload, publish) => {
    if (id) {
      await api(`/admin/training/updates/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload });
      if (publish) await api(`/admin/training/updates/${encodeURIComponent(id)}/publish`, { method: 'POST' });
    } else {
      await api('/admin/training/updates', { method: 'POST', body: { ...payload, status: publish ? 'published' : 'draft' } });
    }
    setEditor(null);
    toast(publish ? 'Update published.' : 'Update saved.');
    await loadUpdates();
  };

  const editSession = async (id) => {
    setActionBusy(id);
    try {
      const result = await api(`/admin/training/sessions/${encodeURIComponent(id)}`);
      setEditor({ kind: 'session', id, initial: { ...sessionForm(result.item), status: result.item.status } });
    } catch (err) {
      toast(err.message || 'Could not open this class.', 'error');
    } finally {
      setActionBusy('');
    }
  };

  const editUpdate = async (id) => {
    setActionBusy(id);
    try {
      const result = await api(`/admin/training/updates/${encodeURIComponent(id)}`);
      setEditor({ kind: 'update', id, initial: { ...updateForm(result.item), status: result.item.status } });
    } catch (err) {
      toast(err.message || 'Could not open this update.', 'error');
    } finally {
      setActionBusy('');
    }
  };

  const action = async (id, actionName, label) => {
    setActionBusy(id);
    try {
      await api(`/admin/training/sessions/${encodeURIComponent(id)}/${actionName}`, { method: 'POST' });
      toast(label);
      await loadSessions();
    } catch (err) {
      toast(err.message || `Could not ${label.toLowerCase()}.`, 'error');
    } finally {
      setActionBusy('');
    }
  };

  const updateAction = async (id, actionName, label) => {
    setActionBusy(id);
    try {
      await api(`/admin/training/updates/${encodeURIComponent(id)}/${actionName}`, { method: 'POST' });
      toast(label);
      await loadUpdates();
    } catch (err) {
      toast(err.message || `Could not ${label.toLowerCase()}.`, 'error');
    } finally {
      setActionBusy('');
    }
  };

  const removeSession = async () => {
    if (!deleteTarget) return;
    setActionBusy(deleteTarget.id);
    try {
      await api(`/admin/training/sessions/${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast('Class deleted.');
      await loadSessions();
    } catch (err) {
      toast(err.message || 'Could not delete this class.', 'error');
    } finally {
      setActionBusy('');
    }
  };

  const confirmCancel = async (event) => {
    event.preventDefault();
    if (!cancelTarget) return;
    const reason = new FormData(event.currentTarget).get('reason');
    setActionBusy(cancelTarget.id);
    try {
      await api(`/admin/training/sessions/${encodeURIComponent(cancelTarget.id)}/cancel`, { method: 'POST', body: { reason } });
      setCancelTarget(null);
      toast('Class cancelled.');
      await loadSessions();
    } catch (err) {
      toast(err.message || 'Could not cancel this class.', 'error');
    } finally {
      setActionBusy('');
    }
  };

  const removeUpdate = async (id) => {
    setActionBusy(id);
    try {
      await api(`/admin/training/updates/${encodeURIComponent(id)}`, { method: 'DELETE' });
      toast('Update deleted.');
      await loadUpdates();
    } catch (err) {
      toast(err.message || 'Could not delete this update.', 'error');
    } finally {
      setActionBusy('');
    }
  };

  if (attendanceId) return <Attendance id={attendanceId} onBack={() => setQuery('attendance', '')} />;

  return (
    <section className="adm-body training-admin-page">
      <header className="adm-head">
        <div><h1>Training</h1><p>Create classes and share updates with verified members.</p></div>
        <Button className="primary sm" onClick={() => setEditor({ kind: tab === 'classes' ? 'session' : 'update', id: null, initial: null })}>
          {tab === 'classes' ? 'Create class' : 'Create update'}
        </Button>
      </header>
      <div className="training-admin-tabs" role="tablist" aria-label="Training management">
        <button type="button" role="tab" aria-selected={tab === 'classes'} className={tab === 'classes' ? 'on' : ''} onClick={() => setQuery('tab', '')}>Classes</button>
        <button type="button" role="tab" aria-selected={tab === 'updates'} className={tab === 'updates' ? 'on' : ''} onClick={() => setQuery('tab', 'updates')}>Updates</button>
      </div>
      {loadError && <div className="form-error mt-4" role="alert">{loadError}<button className="link ml-2" onClick={refresh}>Retry</button></div>}

      {tab === 'classes' && (
        <>
          <div className="training-admin-filters">
            <label><span className="sr-only">Filter classes by status</span><select className="select" value={statusFilter} onChange={(event) => setQuery('status', event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select></label>
            <Link className="link" to="/admin/options">Manage training topics</Link>
          </div>
          {!sessions && !loadError && <Splash />}
          {sessions?.length === 0 && <div className="training-empty">No classes found.</div>}
          {sessions?.map((item) => (
            <article className="training-admin-row" key={item.id}>
              <div className="training-admin-row-main">
                <h2>{item.title}</h2>
                <p>{item.hostName || 'Steeze training'} · {item.topicLabel || 'No topic'} · Creator class</p>
                <p>{item.startsAt ? new Date(item.startsAt).toLocaleString() : 'No date set'} · {item.durationMinutes} min</p>
                <div className="training-admin-row-badges"><Pill tone={item.status === 'published' ? 'ok' : 'off'}>{item.status}</Pill><Pill tone={item.cancelled ? 'bad' : 'wait'}>{item.cancelled ? 'Cancelled' : item.phase}</Pill></div>
              </div>
              <div className="training-admin-actions">
                <Link className="btn line sm" to={`/admin/training?attendance=${encodeURIComponent(item.id)}`}>{item.goingCount} RSVPs</Link>
                <Button className="line sm" loading={actionBusy === item.id} onClick={() => editSession(item.id)}>Edit</Button>
                <Button className="line sm" loading={actionBusy === item.id} onClick={() => action(item.id, 'duplicate', 'Class duplicated')}>Duplicate</Button>
                {item.status === 'draft'
                  ? <Button className="primary sm" loading={actionBusy === item.id} onClick={() => action(item.id, 'publish', 'Class published')}>Publish</Button>
                  : item.cancelled
                    ? <Button className="line sm" loading={actionBusy === item.id} onClick={() => action(item.id, 'uncancel', 'Class restored')}>Restore</Button>
                    : <Button className="line sm" loading={actionBusy === item.id} onClick={() => setCancelTarget(item)}>Cancel class</Button>}
                {item.status === 'published' && <Button className="line sm" loading={actionBusy === item.id} onClick={() => action(item.id, 'unpublish', 'Class unpublished')}>Unpublish</Button>}
                {item.status === 'draft' && item.goingCount === 0 && <button type="button" className="btn danger sm" disabled={Boolean(actionBusy)} onClick={() => setDeleteTarget(item)}>Delete</button>}
              </div>
            </article>
          ))}
          {sessionPages > 1 && <div className="training-admin-pagination"><Button className="line sm" disabled={page <= 1} onClick={() => setQuery('page', String(page - 1))}>Previous</Button><span>Page {page} of {sessionPages}</span><Button className="line sm" disabled={page >= sessionPages} onClick={() => setQuery('page', String(page + 1))}>Next</Button></div>}
        </>
      )}

      {tab === 'updates' && (
        <>
          {!updates && !loadError && <Splash />}
          {updates?.length === 0 && <div className="training-empty">No updates found.</div>}
          {updates?.map((item) => (
            <article className="training-admin-row" key={item.id}>
              <div className="training-admin-row-main">
                <h2>{item.title}</h2><p>{item.body}</p>
                <p>Creators · {item.pinned ? 'Pinned' : 'Not pinned'} · {item.publishedAt ? formatDate(item.publishedAt) : 'Draft'}</p>
                {item.session && <p>Related class: {item.session.title}</p>}
                <Pill tone={item.status === 'published' ? 'ok' : 'off'}>{item.status}</Pill>
              </div>
              <div className="training-admin-actions">
                <Button className="line sm" loading={actionBusy === item.id} onClick={() => editUpdate(item.id)}>Edit</Button>
                {item.status === 'draft'
                  ? <Button className="primary sm" loading={actionBusy === item.id} onClick={() => updateAction(item.id, 'publish', 'Update published')}>Publish</Button>
                  : <Button className="line sm" loading={actionBusy === item.id} onClick={() => updateAction(item.id, 'unpublish', 'Update unpublished')}>Unpublish</Button>}
                <button type="button" className="btn danger sm" disabled={Boolean(actionBusy)} onClick={() => removeUpdate(item.id)}>Delete</button>
              </div>
            </article>
          ))}
          {updatePages > 1 && <div className="training-admin-pagination"><Button className="line sm" disabled={page <= 1} onClick={() => setQuery('page', String(page - 1))}>Previous</Button><span>Page {page} of {updatePages}</span><Button className="line sm" disabled={page >= updatePages} onClick={() => setQuery('page', String(page + 1))}>Next</Button></div>}
        </>
      )}

      {editor?.kind === 'session' && (
        <SessionEditor
          initial={editor.initial}
          topics={topics}
          onClose={() => setEditor(null)}
          onSave={(payload, publish) => saveSession(editor.id, payload, publish)}
        />
      )}
      {editor?.kind === 'update' && (
        <UpdateEditor
          initial={editor.initial}
          sessions={editingSessions}
          onClose={() => setEditor(null)}
          onSave={(payload, publish) => saveUpdate(editor.id, payload, publish)}
        />
      )}
      {cancelTarget && (
        <Modal title={`Cancel "${cancelTarget.title}"?`} onClose={() => setCancelTarget(null)} footer={null}>
          <form className="training-admin-form" onSubmit={confirmCancel}>
            <p className="muted">Members will see that the class was cancelled and its join link will be hidden.</p>
            <label className="field"><span>Reason (optional)</span><textarea className="textarea" name="reason" maxLength={300} rows={3} /></label>
            <div className="training-admin-modal-actions"><button type="button" className="btn line" onClick={() => setCancelTarget(null)}>Keep class</button><Button className="danger-solid" loading={actionBusy === cancelTarget.id}>Cancel class</Button></div>
          </form>
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.title}"?`}
          message="Draft classes without RSVPs can be deleted. Published classes and classes with RSVPs must be cancelled instead."
          confirmLabel="Delete class"
          onClose={() => setDeleteTarget(null)}
          onConfirm={removeSession}
        />
      )}
    </section>
  );
}
