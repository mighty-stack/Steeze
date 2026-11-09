import { isAnalyticsAllowed } from './consent.js';
import { isValidAnalyticsEvent } from './events.js';
import { routePattern } from './routes.js';

const SESSION_KEY = 'clout-analytics-session';
const SESSION_IDLE_MS = 30 * 60 * 1000;
const MAX_QUEUE = 100;
const BATCH_SIZE = 20;
const BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') : '';
let memorySession = null;
let queue = [];
let pendingAttribution = null;
let flushing = false;
let timer;

function randomSid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (saved?.sid && Date.now() - saved.lastActivity < SESSION_IDLE_MS) return saved;
  } catch {
    if (memorySession && Date.now() - memorySession.lastActivity < SESSION_IDLE_MS) return memorySession;
  }
  return { sid: randomSid(), lastActivity: Date.now() };
}

function writeSession(session) {
  memorySession = session;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Keep an in-memory session when storage is disabled.
  }
}

export function getAnalyticsSessionId() {
  const session = readSession();
  session.lastActivity = Date.now();
  writeSession(session);
  return session.sid;
}

function cleanAttribution(value) {
  return String(value || '')
    .trim()
    .slice(0, 60)
    .replace(/@|https?:\/\/|www\.|[a-f0-9]{32,}|[A-Za-z0-9_-]{48,}/i, '')
    .replace(/[^a-z0-9_:/.-]/gi, '_');
}

function classifyReferrer() {
  if (!document.referrer) return 'direct';
  let host = '';
  try {
    host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'referral';
  }
  if (host === window.location.hostname.toLowerCase()) return 'internal';
  if (/google|bing|duckduckgo|yahoo/.test(host)) return 'search';
  if (/whatsapp|instagram|facebook|tiktok|(^|\.)x\.com$|twitter|t\.co|linkedin|youtube/.test(host)) return 'social';
  return 'referral';
}

function browserFamily() {
  const agent = navigator.userAgent;
  if (/Edg\//.test(agent)) return 'edge';
  if (/Firefox\//.test(agent)) return 'firefox';
  if (/Chrome\//.test(agent)) return 'chrome';
  if (/Safari\//.test(agent)) return 'safari';
  return 'other';
}

function deviceClass() {
  const width = window.innerWidth;
  const touch = navigator.maxTouchPoints > 0;
  if (width <= 767) return 'mobile';
  if (width <= 1024 && touch) return 'tablet';
  return 'desktop';
}

function attribution(route) {
  const params = new URLSearchParams(window.location.search);
  return {
    src: cleanAttribution(params.get('utm_source')) || classifyReferrer(),
    med: cleanAttribution(params.get('utm_medium')) || 'unknown',
    camp: cleanAttribution(params.get('utm_campaign')) || 'unknown',
    landing: route,
    device: deviceClass(),
    browser: browserFamily(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
  };
}

export function flushAnalytics() {
  flush();
}

function flush() {
  if (flushing || !queue.length || !isAnalyticsAllowed()) return;
  flushing = true;
  const events = queue.splice(0, BATCH_SIZE);
  const sessionId = getAnalyticsSessionId();
  const body = {
    sid: sessionId,
    ...(pendingAttribution ? { a: pendingAttribution } : {}),
    events,
  };
  fetch(`${BASE}/api/pulse`, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((response) => {
    if (response.ok && body.a) pendingAttribution = null;
  }).catch(() => {
    queue = [...events, ...queue].slice(-MAX_QUEUE);
  }).finally(() => {
    flushing = false;
    if (queue.length) setTimeout(flush, 0);
  });
}

export function track(name, props) {
  try {
    if (!isAnalyticsAllowed() || !isValidAnalyticsEvent(name, props)) return;
    const session = readSession();
    const route = props.route || routePattern(window.location.pathname);
    if (!pendingAttribution) pendingAttribution = attribution(route);
    session.lastActivity = Date.now();
    writeSession(session);
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push({ n: name, p: props });
    if (queue.length >= BATCH_SIZE) flush();
  } catch {
    // Analytics must not interfere with the application.
  }
}

export function hashErrorMessage(value) {
  let hash = 2166136261;
  for (const char of String(value)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function sanitizeErrorMessage(value) {
  return String(value || 'Unknown error')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/https?:\/\/\S+|www\.\S+/gi, '[url]')
    .replace(/\b[A-F0-9]{32,}\b/gi, '[token]')
    .replace(/\b[A-Za-z0-9_-]{48,}\b/g, '[token]')
    .slice(0, 160);
}

let errorsSent = 0;
const errorHashes = new Set();
export function trackClientError(message) {
  if (errorsSent >= 10) return;
  const route = routePattern(window.location.pathname);
  const msg = sanitizeErrorMessage(message);
  const hash = hashErrorMessage(`${route}:${msg}`);
  if (errorHashes.has(hash)) return;
  errorHashes.add(hash);
  errorsSent += 1;
  track('client_error', { hash, route, msg });
}

function flushOnExit() {
  if (queue.length && isAnalyticsAllowed()) flush();
}

if (typeof window !== 'undefined') {
  timer = setInterval(() => {
    if (queue.length) flush();
  }, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnExit();
  });
  window.addEventListener('pagehide', flushOnExit);
  window.addEventListener('clout-analytics-consent-change', (event) => {
    if (event.detail?.optOut) {
      queue = [];
      pendingAttribution = null;
    }
  });
  void timer;
}
