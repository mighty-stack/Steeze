export const TRAINING_TIMEZONES = [
  { value: 'Africa/Lagos', label: 'Lagos (UTC+01:00)', offsetMinutes: 60 },
  { value: 'Africa/Accra', label: 'Accra (UTC+00:00)', offsetMinutes: 0 },
  { value: 'Africa/Nairobi', label: 'Nairobi (UTC+03:00)', offsetMinutes: 180 },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (UTC+02:00)', offsetMinutes: 120 },
  { value: 'UTC', label: 'UTC (UTC+00:00)', offsetMinutes: 0 },
];

const pad = (value) => String(value).padStart(2, '0');

export function localDateTimeToUtc(date, time, timeZone) {
  const zone = TRAINING_TIMEZONES.find((item) => item.value === timeZone);
  if (!zone) throw new Error('Choose a supported timezone.');
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time || '');
  if (!dateMatch || !timeMatch) throw new Error('Enter a valid class date and time.');
  const [, year, month, day] = dateMatch.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  const local = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (local.getUTCFullYear() !== year || local.getUTCMonth() !== month - 1 || local.getUTCDate() !== day || hour > 23 || minute > 59) {
    throw new Error('Enter a valid class date and time.');
  }
  return new Date(local.getTime() - zone.offsetMinutes * 60_000).toISOString();
}

export function utcToLocalDateTime(value, timeZone) {
  const zone = TRAINING_TIMEZONES.find((item) => item.value === timeZone);
  const date = new Date(value);
  if (!zone || Number.isNaN(date.getTime())) return { date: '', time: '' };
  const local = new Date(date.getTime() + zone.offsetMinutes * 60_000);
  return {
    date: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`,
  };
}

export function memberTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function classDateTime(start, end) {
  const timeZone = memberTimezone();
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: 'medium',
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
  const date = new Date(start);
  const startTime = timeFormatter.format(date);
  const endTime = end ? timeFormatter.format(new Date(end)) : '';
  return {
    date: dateFormatter.format(date),
    range: endTime ? `${startTime} – ${endTime}` : startTime,
    timeZone,
    title: `Shown in ${timeZone}`,
  };
}

export function relativeClassTime(value, now = Date.now()) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '';
  const difference = time - now;
  const units = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['week', 604_800_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  const [unit, size] = units.find(([, duration]) => Math.abs(difference) >= duration) || ['minute', 60_000];
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(difference / size), unit);
}

export function externalHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}
