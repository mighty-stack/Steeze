import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/Auth.jsx';
import { Button } from '../../components/ui.jsx';

const timezones = [
  'Africa/Lagos',
  'UTC',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
];

export default function StaffSettings() {
  const { refresh } = useAuth();
  const [form, setForm] = useState({ staffTimezone: 'Africa/Lagos', emailReminders: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api('/staff/me');
        if (!active) return;
        setForm({
          staffTimezone: data.timezone || 'Africa/Lagos',
          emailReminders: data.emailReminders !== false,
        });
        setError('');
      } catch (err) {
        if (active) setError(err.message || 'Could not load your settings.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api('/staff/settings', {
        method: 'PATCH',
        body: {
          staffTimezone: form.staffTimezone,
          emailReminders: form.emailReminders,
        },
      });
      setSuccess('Settings saved.');
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not save your settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="db-fallback">Loading settings...</p>;
  }

  return (
    <section className="db-panel">
      <h1>Staff settings</h1>
      <form onSubmit={handleSubmit} className="stack-form">
        <label>
          <span>Timezone</span>
          <select
            value={form.staffTimezone}
            onChange={(event) => setForm((current) => ({ ...current, staffTimezone: event.target.value }))}
          >
            {timezones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.emailReminders}
            onChange={(event) => setForm((current) => ({ ...current, emailReminders: event.target.checked }))}
          />
          <span>Send me reminder emails for assigned interviews</span>
        </label>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <Button className="primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save settings'}
        </Button>
      </form>
    </section>
  );
}
