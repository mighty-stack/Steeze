export const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
];
export const platformLabel = (v) => PLATFORMS.find((p) => p.value === v)?.label || v;

export const formatDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', opts) : '';

// "Today", "Yesterday", or "24 Sep" for the admin table.
export function relativeDay(iso) {
  const d = new Date(iso);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(diff > 300 ? { year: 'numeric' } : {}) });
}

export const compactNumber = (n) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
export const fullNumber = (n) => new Intl.NumberFormat('en').format(n);

export const initial = (name) => (name?.trim()?.[0] || '?').toUpperCase();

export const STATUS = {
  pending: { label: 'Email unverified', tone: 'wait' },
  verified: { label: 'Verified', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'bad' },
  deactivated: { label: 'Deactivated', tone: 'off' },
};
// Deactivation overrides verification in what the admin sees at a glance.
export const statusOf = (user) => (user.accountStatus === 'deactivated' ? STATUS.deactivated : STATUS[user.verificationStatus]);
