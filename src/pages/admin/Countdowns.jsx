import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client.js';
import { Button, ConfirmDialog, Splash } from '../../components/ui.jsx';
import { useToast } from '../../context/Toast.jsx';
import '../../styles/countdown-admin.css';

const TIMEZONE = 'Africa/Lagos';

function localDateKey(value = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date(value))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function weekdayForDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'long',
  }).format(new Date(`${date}T12:00:00+01:00`));
}

function formatLocalDateTime(value) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, dateStyle: 'medium' }).format(new Date(value))
    : '—';
}

function DeliveryCounts({ deliveries }) {
  return (
    <span className="countdown-delivery-summary">
      Sent {deliveries.sent} · Failed {deliveries.failed} · Skipped {deliveries.skipped}
    </span>
  );
}

function MilestoneTable({ milestones, selectedRekeys, onToggleRekey }) {
  return (
    <div className="countdown-table-scroll">
      <table className="countdown-milestone-table">
        <caption>Milestone send dates and delivery counts</caption>
        <thead>
          <tr>
            <th scope="col">Milestone</th>
            <th scope="col">Send date</th>
            <th scope="col">State</th>
            <th scope="col">Email deliveries</th>
            <th scope="col">In-app deliveries</th>
            {onToggleRekey && <th scope="col">Re-send</th>}
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => (
            <tr key={milestone.key}>
              <th scope="row">{milestone.key} ({milestone.daysBefore} days before)</th>
              <td>{milestone.weekday}, {formatDate(`${milestone.sendDate}T12:00:00+01:00`)}</td>
              <td><span className={`countdown-state is-${milestone.state}`}>{milestone.state === 'passed' ? 'Passed — will be skipped' : milestone.state.replace('_', ' ')}</span></td>
              <td><DeliveryCounts deliveries={milestone.deliveries.email} /></td>
              <td><DeliveryCounts deliveries={milestone.deliveries.inapp} /></td>
              {onToggleRekey && (
                <td>
                  <label className="countdown-rekey-control">
                    <input
                      type="checkbox"
                      checked={selectedRekeys.includes(milestone.key)}
                      disabled={milestone.state === 'passed'}
                      onChange={() => onToggleRekey(milestone.key)}
                    />
                    <span>Allow this message to be sent again</span>
                  </label>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Countdowns() {
  const toast = useToast();
  const [campaign, setCampaign] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [preview, setPreview] = useState(null);
  const [date, setDate] = useState('');
  const [selectedRekeys, setSelectedRekeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api('/admin/countdowns');
      setCampaign(result.campaign);
      setCurrentPlan(result.plan);
      setDate(localDateKey(result.campaign.targetAt));
      setPreview(null);
      setSelectedRekeys([]);
    } catch (err) {
      setError(err.message || 'Could not load the countdown campaign.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const campaignId = campaign?._id;
  const dateWeekday = useMemo(() => (date ? weekdayForDate(date) : ''), [date]);

  const updateEnabled = async (enabled) => {
    setBusy('enabled');
    try {
      await api(`/admin/countdowns/${encodeURIComponent(campaignId)}`, {
        method: 'PATCH',
        body: { enabled },
      });
      toast(`Countdown ${enabled ? 'enabled' : 'disabled'}.`);
      await load();
    } catch (err) {
      toast(err.message || 'Could not update the countdown.', 'error');
    } finally {
      setBusy('');
    }
  };

  const previewDate = async () => {
    setError('');
    setBusy('preview');
    try {
      const result = await api(`/admin/countdowns/${encodeURIComponent(campaignId)}/retarget/preview`, {
        method: 'POST',
        body: { date },
      });
      setPreview(result);
      setSelectedRekeys([]);
    } catch (err) {
      setError(err.message || 'Could not preview this date.');
      setPreview(null);
    } finally {
      setBusy('');
    }
  };

  const toggleRekey = (key) => {
    setSelectedRekeys((current) => (
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    ));
  };

  const confirmRetarget = async () => {
    setBusy('retarget');
    try {
      const result = await api(`/admin/countdowns/${encodeURIComponent(campaignId)}/retarget`, {
        method: 'POST',
        body: {
          date,
          expectedFrom: campaign.targetAt,
          confirm: true,
          ...(selectedRekeys.length ? { rekeyMilestones: selectedRekeys } : {}),
        },
      });
      setConfirming(false);
      toast(result.unchanged
        ? `Countdown is already set to ${date}.`
        : `Resumption date changed to ${date}.`);
      await load();
    } catch (err) {
      setError(err.message || 'Could not change the resumption date.');
      toast(err.message || 'Could not change the resumption date.', 'error');
    } finally {
      setBusy('');
    }
  };

  const updateTargetText = (event) => {
    setDate(event.target.value);
    setPreview(null);
    setSelectedRekeys([]);
  };

  if (loading && !campaign) return <div className="countdown-admin-page"><Splash /></div>;

  return (
    <section className="adm-body countdown-admin-page">
      <header className="adm-head">
        <div>
          <h1>Resumption countdown</h1>
          <p>Review campaign timing and retarget without creating a new campaign.</p>
        </div>
        <Button className="line sm" onClick={load} loading={loading}>Refresh</Button>
      </header>

      {error && <div className="countdown-admin-error" role="alert">{error}</div>}
      {campaign && (
        <>
          <section className="countdown-admin-panel" aria-labelledby="countdown-current-heading">
            <div className="countdown-admin-panel-heading">
              <div>
                <h2 id="countdown-current-heading">{campaign.title}</h2>
                <p>Target: {formatLocalDateTime(campaign.targetAt)} ({TIMEZONE})</p>
              </div>
              <label className="countdown-enabled-control">
                <input
                  type="checkbox"
                  checked={Boolean(campaign.enabled)}
                  disabled={busy === 'enabled'}
                  onChange={(event) => updateEnabled(event.target.checked)}
                />
                <span>Campaign enabled</span>
              </label>
            </div>
            <MilestoneTable milestones={currentPlan?.milestones || []} />
          </section>

          <section className="countdown-admin-panel" aria-labelledby="countdown-retarget-heading">
            <div className="countdown-admin-panel-heading">
              <div>
                <h2 id="countdown-retarget-heading">Change resumption date</h2>
                <p>Preview shows passed milestones; they will be skipped, never sent late.</p>
              </div>
            </div>
            <div className="countdown-retarget-form">
              <label htmlFor="countdown-new-date">New date (Africa/Lagos)</label>
              <div className="countdown-retarget-controls">
                <input
                  id="countdown-new-date"
                  className="input"
                  type="date"
                  min={localDateKey()}
                  value={date}
                  onChange={updateTargetText}
                />
                <Button className="primary sm" loading={busy === 'preview'} disabled={!date} onClick={previewDate}>Preview</Button>
              </div>
              {date && <p className="countdown-date-weekday">{dateWeekday}, {date}</p>}
            </div>

            {preview && (
              <div className="countdown-retarget-preview">
                <h3>Preview for {dateWeekday}, {date}</h3>
                {preview.milestones.some((milestone) => milestone.warning) && (
                  <div className="countdown-warning" role="status">
                    {preview.milestones.filter((milestone) => milestone.warning).map((milestone) => (
                      <p key={milestone.key}>{milestone.key}: {milestone.warning}</p>
                    ))}
                  </div>
                )}
                <MilestoneTable
                  milestones={preview.milestones}
                  selectedRekeys={selectedRekeys}
                  onToggleRekey={toggleRekey}
                />
                <Button className="primary sm" disabled={busy === 'retarget'} onClick={() => setConfirming(true)}>
                  Confirm date change
                </Button>
              </div>
            )}
          </section>

          <section className="countdown-admin-panel" aria-labelledby="countdown-history-heading">
            <h2 id="countdown-history-heading">Retarget history</h2>
            {(campaign.retargetHistory || []).length === 0
              ? <p>No retargets recorded.</p>
              : (
                <ul className="countdown-history-list">
                  {[...campaign.retargetHistory].slice(-5).reverse().map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      <span>{formatDate(entry.from)} → {formatDate(entry.to)}</span>
                      <small>{entry.source || 'legacy'} · {formatLocalDateTime(entry.at)}</small>
                      {entry.rekeyed?.length > 0 && <small>Re-keyed: {entry.rekeyed.join(', ')}</small>}
                    </li>
                  ))}
                </ul>
              )}
          </section>
        </>
      )}

      {confirming && (
        <ConfirmDialog
          title="Confirm resumption date"
          message={`Change the resumption date to ${dateWeekday}, ${date}? Passed milestones will be skipped. Existing delivery rows will prevent duplicates${selectedRekeys.length ? `; checked milestones will be re-keyed for another send round: ${selectedRekeys.join(', ')}` : ''}.`}
          confirmLabel={busy === 'retarget' ? 'Saving…' : 'Confirm change'}
          danger={false}
          error={error}
          onClose={() => setConfirming(false)}
          onConfirm={confirmRetarget}
        />
      )}
    </section>
  );
}
