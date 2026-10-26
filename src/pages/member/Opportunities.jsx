import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/Auth.jsx';
import { api, ApiError } from '../../api/client.js';
import { useToast } from '../../context/Toast.jsx';
import { Button, ConfirmDialog, Modal, Pill, Splash, cx } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';

const STATUS = {
  pending: { label: 'Interest sent', tone: 'wait' },
  shortlisted: { label: 'Shortlisted', tone: 'ok' },
  declined: { label: 'Not selected', tone: 'bad' },
  withdrawn: { label: 'Withdrawn', tone: 'off' },
};
const ACTIVE_STATUSES = ['pending', 'shortlisted', 'declined'];

function friendlyError(error) {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';
  if (error.status === 409) {
    if (/already shown interest/i.test(error.message)) return "You've already shown interest in this opportunity.";
    return 'This opportunity is no longer open. Refresh the list and try another opportunity.';
  }
  if (error.status === 429) return 'You have made several updates recently. Please wait a while and try again.';
  if (error.status === 403) return 'Only verified, active members can respond to opportunities.';
  return error.message;
}

function CreatorOpportunities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const tab = searchParams.get('view') === 'mine' ? 'mine' : 'all';
  const statusFilter = searchParams.get('status');
  const opportunityFilter = searchParams.get('opportunity');
  const [interestTarget, setInterestTarget] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setError('');
    try {
      const result = await api('/opportunities');
      setItems(result.items);
    } catch (err) {
      setError(err.message || 'Could not load opportunities.');
    }
  };
  useEffect(() => { load(); }, []);

  const visibleItems = useMemo(
    () => (items || []).filter((item) => (
      (tab === 'all' || item.myInterest)
      && (!statusFilter || item.myInterest?.status === statusFilter)
      && (!opportunityFilter || item.id === opportunityFilter)
    )),
    [items, tab, statusFilter, opportunityFilter],
  );
  const updateView = (view) => {
    const next = new URLSearchParams(searchParams);
    if (view === 'all') next.delete('view');
    else next.set('view', view);
    next.delete('status');
    next.delete('opportunity');
    setSearchParams(next);
  };

  const setInterest = (id, myInterest) => setItems((current) =>
    current?.map((item) => (item.id === id ? { ...item, myInterest } : item)));

  const submitInterest = async () => {
    const item = interestTarget;
    if (!item) return;
    const previous = item.myInterest;
    const optimistic = {
      id: previous?.id,
      status: 'pending',
      message: message.trim() || undefined,
      createdAt: previous?.createdAt || new Date().toISOString(),
    };
    setInterest(item.id, optimistic);
    setBusyId(item.id);
    try {
      const result = await api(`/opportunities/${item.id}/interest`, {
        method: 'POST',
        body: { ...(message.trim() ? { message: message.trim() } : {}) },
      });
      setInterest(item.id, result.interest);
      setInterestTarget(null);
      toast('Your interest was sent.');
    } catch (err) {
      setInterest(item.id, previous || null);
      toast(friendlyError(err), 'error');
    } finally {
      setBusyId('');
    }
  };

  const withdrawInterest = async () => {
    const item = withdrawTarget;
    if (!item) return;
    const previous = item.myInterest;
    setInterest(item.id, { ...previous, status: 'withdrawn' });
    setBusyId(item.id);
    try {
      await api(`/opportunities/${item.id}/interest`, { method: 'DELETE' });
      setInterest(item.id, { ...previous, status: 'withdrawn' });
      setWithdrawTarget(null);
      toast('Your interest was withdrawn.');
    } catch (err) {
      setInterest(item.id, previous);
      toast(friendlyError(err), 'error');
    } finally {
      setBusyId('');
    }
  };

  const closeInterestModal = useCallback(() => {
    if (!busyId) setInterestTarget(null);
  }, [busyId]);

  return (
    <section aria-labelledby="opportunities-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 mt-7">
        <div>
          <h2 id="opportunities-heading">Opportunities</h2>
          <p className="text-ink-soft mt-1">Explore opportunities that match your profile and let the team know you are interested.</p>
        </div>
      </div>
      <div className="tabbar" role="tablist" aria-label="Opportunity list">
        <button type="button" role="tab" aria-selected={tab === 'all'} className={cx(tab === 'all' && 'on')} onClick={() => updateView('all')}>All</button>
        <button type="button" role="tab" aria-selected={tab === 'mine'} className={cx(tab === 'mine' && 'on')} onClick={() => updateView('mine')}>My interests</button>
      </div>
      {statusFilter && <button className="link db-filter-clear" onClick={() => {
        const next = new URLSearchParams(searchParams);
        next.delete('status');
        next.delete('opportunity');
        setSearchParams(next);
      }}>Showing {statusFilter === 'shortlisted' ? 'shortlisted' : statusFilter} · Clear filter</button>}

      {error && <div className="form-error mt-5" role="alert">{error}<button className="link ml-2" onClick={load}>Try again</button></div>}
      {!items && !error && <Splash />}
      {items && visibleItems.length === 0 && (
        <div className="card mt-5">
          <h2>{tab === 'mine' ? 'No interests yet' : 'No opportunities available'}</h2>
          <p className="card-lede">{tab === 'mine' ? 'Opportunities you respond to will appear here.' : 'Check back soon for new opportunities.'}</p>
        </div>
      )}
      {visibleItems.map((item) => {
        const interest = item.myInterest;
        const status = interest ? STATUS[interest.status] : null;
        const canWithdraw = item.isOpen && interest && ACTIVE_STATUSES.includes(interest.status);
        const canReapply = item.isOpen && interest?.status === 'withdrawn';
        return (
          <article className="card mt-4.5" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2>{item.title}</h2>
                <p className="card-lede whitespace-pre-line">{item.description}</p>
                <p className="mt-3 text-sm font-medium text-ink-soft">
                  {item.isOpen ? (item.closesAt ? `Closes ${formatDate(item.closesAt)}` : 'Open') : 'Closed'}
                </p>
              </div>
              {status && <Pill tone={status.tone}>{status.label}</Pill>}
            </div>
            {item.isOpen && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {!interest || canReapply ? (
                  <Button className="blue sm" loading={busyId === item.id} disabled={Boolean(busyId)} onClick={() => {
                    setMessage('');
                    setInterestTarget(item);
                  }}>I'm interested</Button>
                ) : null}
                {canWithdraw && (
                  <Button className="line sm" loading={busyId === item.id} disabled={Boolean(busyId)} onClick={() => setWithdrawTarget(item)}>
                    Withdraw
                  </Button>
                )}
              </div>
            )}
          </article>
        );
      })}

      {interestTarget && (
        <Modal
          title="Express interest"
          onClose={closeInterestModal}
          footer={(
            <>
              <button className="btn line" onClick={() => setInterestTarget(null)} disabled={Boolean(busyId)}>Cancel</button>
              <Button className="blue" loading={busyId === interestTarget.id} disabled={Boolean(busyId)} onClick={submitInterest}>Send interest</Button>
            </>
          )}
        >
          <p className="text-ink-soft">{interestTarget.title}</p>
          <div className="field">
            <label htmlFor="interest-message">Short message <span className="opt">Optional</span></label>
            <textarea
              id="interest-message"
              className="textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 500))}
              maxLength={500}
              rows={5}
              aria-describedby="interest-message-count"
            />
            <span id="interest-message-count" className="hint text-right">{message.length}/500</span>
          </div>
        </Modal>
      )}
      {withdrawTarget && (
        <ConfirmDialog
          title="Withdraw your interest?"
          message={`You can express interest again while “${withdrawTarget.title}” is open.`}
          confirmLabel="Withdraw"
          onClose={() => setWithdrawTarget(null)}
          onConfirm={withdrawInterest}
        />
      )}
    </section>
  );
}

export default function Opportunities() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  return user?.role === 'brand' && searchParams.get('view') === 'mine'
    ? <BrandOpportunities />
    : <CreatorOpportunities />;
}

function BrandOpportunities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const view = searchParams.get('view') === 'mine' ? 'mine' : 'browse';
  const statusFilter = searchParams.get('status');
  const [items, setItems] = useState(null);
  const [newInterestIds, setNewInterestIds] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(searchParams.get('create') === '1');
  const [busyId, setBusyId] = useState('');
  const [form, setForm] = useState({ title: '', description: '', closesAt: '' });

  const load = useCallback(async () => {
    setError('');
    try {
      if (view === 'mine') {
        const status = ['draft', 'pending_review', 'published', 'closed', 'rejected'].includes(statusFilter) ? statusFilter : '';
        const query = new URLSearchParams({ limit: '100' });
        if (status) query.set('status', status);
        const [result, dashboard] = await Promise.all([
          api(`/brand/opportunities?${query}`),
          api('/dashboard'),
        ]);
        setItems(result.items);
        setNewInterestIds((dashboard.newInterests || []).map((interest) => interest.opportunity?.id).filter(Boolean));
      } else {
        const result = await api('/opportunities');
        setItems(result.items);
      }
    } catch (err) {
      setError(err.message || 'Could not load opportunities.');
    }
  }, [view, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (searchParams.get('create') === '1') setCreating(true);
  }, [searchParams]);

  const changeView = (nextView) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', nextView === 'mine' ? 'mine' : 'all');
    next.delete('status');
    next.delete('create');
    setSearchParams(next);
  };
  const clearCreateParam = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
  };
  const mineItems = (items || []).filter((item) => {
    if (statusFilter === 'new') return newInterestIds.includes(item.id);
    if (statusFilter && ['draft', 'pending_review', 'published', 'closed', 'rejected'].includes(statusFilter)) return item.status === statusFilter;
    return true;
  });
  const saveGig = async (event) => {
    event.preventDefault();
    setBusyId('new');
    try {
      await api('/brand/opportunities', {
        method: 'POST',
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          closesAt: form.closesAt || null,
        },
      });
      setForm({ title: '', description: '', closesAt: '' });
      setCreating(false);
      clearCreateParam();
      changeView('mine');
      toast('Draft gig created. Submit it when it is ready.');
      await load();
    } catch (err) {
      toast(err.message || 'Could not create the gig.', 'error');
    } finally {
      setBusyId('');
    }
  };
  const actOnGig = async (item, action) => {
    setBusyId(item.id);
    try {
      await api(`/brand/opportunities/${item.id}/${action}`, { method: 'POST' });
      toast(action === 'submit' ? 'Gig submitted.' : action === 'close' ? 'Gig closed.' : action === 'reopen' ? 'Gig reopened.' : 'Gig moved to drafts.');
      await load();
    } catch (err) {
      toast(err.message || 'Could not update the gig.', 'error');
    } finally {
      setBusyId('');
    }
  };

  return (
    <section aria-labelledby="brand-opportunities-heading">
      <div className="db-page-heading">
        <div>
          <h2 id="brand-opportunities-heading">{view === 'mine' ? 'My opportunities' : 'Opportunities'}</h2>
          <p className="text-ink-soft mt-1">{view === 'mine' ? 'Manage your gigs and review creator interest.' : 'Explore calls and collaborations available to brands.'}</p>
        </div>
        {view === 'mine' && <Button className="blue sm" onClick={() => setCreating(true)}>Post a gig</Button>}
      </div>
      <div className="tabbar" role="tablist" aria-label="Brand opportunities">
        <button type="button" role="tab" aria-selected={view === 'browse'} className={cx(view === 'browse' && 'on')} onClick={() => changeView('browse')}>Browse</button>
        <button type="button" role="tab" aria-selected={view === 'mine'} className={cx(view === 'mine' && 'on')} onClick={() => changeView('mine')}>My gigs</button>
      </div>
      {view === 'mine' && (
        <div className="filters db-gig-filters">
          <select className="select" value={statusFilter || ''} onChange={(event) => {
            const next = new URLSearchParams(searchParams);
            if (event.target.value) next.set('status', event.target.value);
            else next.delete('status');
            setSearchParams(next);
          }} aria-label="Filter my gigs">
            <option value="">All gigs</option>
            <option value="new">With new interest</option>
            <option value="draft">Draft</option>
            <option value="pending_review">In review</option>
            <option value="published">Live</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}
      {error && <div className="form-error mt-5" role="alert">{error}<button className="link ml-2" onClick={load}>Try again</button></div>}
      {!items && !error && <Splash />}
      {items && view === 'mine' && mineItems.length === 0 && (
        <div className="card mt-5">
          <h2>{statusFilter ? 'No gigs match this filter' : 'No gigs yet'}</h2>
          <p className="card-lede">Post your first gig to invite creators to collaborate with your brand.</p>
          <Button className="blue sm mt-4" onClick={() => setCreating(true)}>Post your first gig</Button>
        </div>
      )}
      {items && view === 'mine' && mineItems.map((item) => (
        <article className="card mt-4.5" key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2>{item.title}</h2>
              <p className="card-lede whitespace-pre-line">{item.description}</p>
              <p className="mt-3 text-sm text-ink-soft">{item.closesAt ? `Closes ${formatDate(item.closesAt)}` : 'No closing date'}</p>
            </div>
            <Pill tone={item.status === 'published' ? 'ok' : item.status === 'pending_review' ? 'wait' : item.status === 'rejected' ? 'bad' : 'off'}>
              {item.status === 'pending_review' ? 'In review' : item.status}
            </Pill>
          </div>
          <div className="flex flex-wrap gap-2.5 mt-4">
            <Link className="btn line sm" to={`/app/opportunities/${item.id}/interests`}>Review interest</Link>
            {['draft', 'rejected'].includes(item.status) && <Button className="blue sm" loading={busyId === item.id} onClick={() => actOnGig(item, 'submit')}>Submit for review</Button>}
            {item.status === 'pending_review' && <Button className="line sm" loading={busyId === item.id} onClick={() => actOnGig(item, 'withdraw')}>Withdraw submission</Button>}
            {item.status === 'published' && <Button className="line sm" loading={busyId === item.id} onClick={() => actOnGig(item, 'close')}>Close gig</Button>}
            {item.status === 'closed' && <Button className="line sm" loading={busyId === item.id} onClick={() => actOnGig(item, 'reopen')}>Reopen</Button>}
          </div>
        </article>
      ))}
      {items && view === 'browse' && items.length === 0 && (
        <div className="card mt-5"><h2>No opportunities available</h2><p className="card-lede">Check back soon for new opportunities.</p></div>
      )}
      {items && view === 'browse' && items.map((item) => (
        <article className="card mt-4.5" key={item.id}>
          <h2>{item.title}</h2>
          <p className="card-lede whitespace-pre-line">{item.description}</p>
          <p className="mt-3 text-sm text-ink-soft">{item.isOpen ? (item.closesAt ? `Closes ${formatDate(item.closesAt)}` : 'Open') : 'Closed'}</p>
        </article>
      ))}
      {creating && (
        <Modal title="Post a gig" onClose={() => { setCreating(false); clearCreateParam(); }}>
          <form className="form-grid" onSubmit={saveGig}>
            <div className="field">
              <label htmlFor="gig-title">Title</label>
              <input id="gig-title" className="input" required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="gig-description">Description</label>
              <textarea id="gig-description" className="textarea" required minLength={10} maxLength={2000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="gig-closes">Closes on <span className="opt">Optional</span></label>
              <input id="gig-closes" className="input" type="date" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} />
            </div>
            <div className="flex justify-end gap-2.5">
              <button type="button" className="btn line sm" onClick={() => { setCreating(false); clearCreateParam(); }}>Cancel</button>
              <Button type="submit" className="blue sm" loading={busyId === 'new'}>Save draft</Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
