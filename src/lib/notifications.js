export const NOTIFICATION_CATEGORIES = {
  gigs: 'New opportunities',
  collaboration: 'Collaboration',
  applications: 'Applications',
  growth: 'Creator growth',
  account: 'Account',
  platform: 'Platform updates',
  admin: 'Admin activity',
  training: 'Training',
};

export const MUTABLE_NOTIFICATION_CATEGORIES = ['gigs', 'collaboration', 'admin', 'training'];
export const NOTIFICATIONS_CHANGED_EVENT = 'cloutlabs:notifications-changed';

export function notificationCategoryLabel(category) {
  return NOTIFICATION_CATEGORIES[category] || String(category || 'Other').replaceAll('_', ' ');
}

export function notificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const elapsed = Date.now() - date.getTime();
  const units = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['week', 604_800_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const [unit, duration] = units.find(([, size]) => Math.abs(elapsed) >= size) || ['second', 1_000];
  return formatter.format(-Math.round(elapsed / duration), unit);
}

export function notificationDestination(link, role) {
  const fallback = role === 'admin' ? '/admin' : '/app';
  if (typeof link !== 'string' || !link.startsWith('/') || link.startsWith('//')) return fallback;

  let url;
  try {
    url = new URL(link, window.location.origin);
  } catch {
    return fallback;
  }
  if (url.origin !== window.location.origin) return fallback;

  const suffix = `${url.search}${url.hash}`;
  if (url.pathname === '/dashboard' || url.pathname === '/dashboard/') return fallback;
  if (url.pathname === '/opportunities' || url.pathname === '/opportunities/') {
    return `${role === 'admin' ? '/admin/opportunities' : '/app/opportunities'}${suffix}`;
  }

  const opportunity = /^\/opportunities\/([^/]+)\/?$/.exec(url.pathname);
  if (opportunity) {
    let id;
    try {
      id = encodeURIComponent(decodeURIComponent(opportunity[1]));
    } catch {
      return fallback;
    }
    if (role === 'brand') return `/app/opportunities/${id}/interests${suffix}`;
    if (role === 'admin') return `/admin/opportunities${suffix}`;
    return `/app/opportunities?opportunity=${id}`;
  }

  if (url.pathname === '/score' && role === 'creator') return `/app/score${suffix}`;
  if (role === 'creator' && url.pathname === '/training') return `/app/training${suffix}`;
  const trainingClass = /^\/training\/classes\/([^/]+)\/?$/.exec(url.pathname);
  if (role === 'creator' && trainingClass) {
    let id;
    try {
      id = encodeURIComponent(decodeURIComponent(trainingClass[1]));
    } catch {
      return fallback;
    }
    return `/app/training/classes/${id}${suffix}`;
  }
  if (role === 'creator' && url.pathname === '/training/updates') return `/app/training/updates${suffix}`;
  if (role === 'admin' && (url.pathname === '/admin' || url.pathname.startsWith('/admin/'))) {
    return `${url.pathname}${suffix}`;
  }
  return fallback;
}

export function emitNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}
