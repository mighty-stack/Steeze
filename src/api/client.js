const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TIMEOUT_MS = 90_000; // a sleeping Render free-tier server can take up to ~60s to wake
const SLOW_AFTER_MS = 4_000;

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields || {};
  }
}

/* ---- "server is waking up" signal ----
   Any request still pending after a few seconds flips `slow` on, so the UI can explain the wait
   instead of looking broken. */
let pending = 0;
let slow = false;
let timer = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l(slow));

export function subscribeSlow(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function requestStarted() {
  pending += 1;
  if (pending === 1) {
    timer = setTimeout(() => {
      slow = true;
      emit();
    }, SLOW_AFTER_MS);
  }
}
function requestFinished() {
  pending = Math.max(0, pending - 1);
  if (pending === 0) {
    clearTimeout(timer);
    if (slow) {
      slow = false;
      emit();
    }
  }
}

async function send(url, options) {
  requestStarted();
  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { credentials: 'include', signal: controller.signal, ...options });
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    throw new ApiError(
      0,
      timedOut ? 'TIMEOUT' : 'NETWORK',
      timedOut
        ? 'The server took too long to respond. Try again in a moment.'
        : 'Cannot reach the server. Check your connection and try again.',
    );
  } finally {
    clearTimeout(abort);
    requestFinished();
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await send(`${BASE}/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, e?.code || 'ERROR', e?.message || 'Something went wrong. Try again.', e?.fields);
  }
  return data;
}

// Downloads a file the API protects with the login cookie (used for the CSV export).
export async function download(path) {
  const res = await send(`${BASE}/api${path}`, {});
  if (!res.ok) {
    let msg = 'Download failed. Try again.';
    try {
      msg = (await res.json())?.error?.message || msg;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, 'DOWNLOAD', msg);
  }
  const match = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = match?.[1] || 'download.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Wakes a sleeping free-tier server while the visitor is still reading the landing page.
export function warmUp() {
  fetch(`${BASE}/health`, { credentials: 'omit' }).catch(() => {});
}

export const qs = (params) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') s.set(k, v);
  const out = s.toString();
  return out ? `?${out}` : '';
};
