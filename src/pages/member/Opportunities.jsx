import { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function Opportunities() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
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
    () => (items || []).filter((item) => tab === 'all' || item.myInterest),
    [items, tab],
  );

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
        <button type="button" role="tab" aria-selected={tab === 'all'} className={cx(tab === 'all' && 'on')} onClick={() => setTab('all')}>All</button>
        <button type="button" role="tab" aria-selected={tab === 'mine'} className={cx(tab === 'mine' && 'on')} onClick={() => setTab('mine')}>My interests</button>
      </div>

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
