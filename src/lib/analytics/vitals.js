import { getAnalyticsSessionId, flushAnalytics, track } from './track.js';
import { routePattern } from './routes.js';

function selectedSession() {
  const sid = getAnalyticsSessionId();
  return Number.parseInt(sid.slice(-2), 16) % 4 === 0;
}

function metricBucket(name, value) {
  if (name === 'LCP') return value <= 2500 ? 'good' : value <= 4000 ? 'ni' : 'poor';
  if (name === 'CLS') return value <= 0.1 ? 'good' : value <= 0.25 ? 'ni' : 'poor';
  return value <= 200 ? 'good' : value <= 500 ? 'ni' : 'poor';
}

export function observeWebVitals() {
  if (!selectedSession() || typeof PerformanceObserver === 'undefined') return () => {};
  const values = { LCP: null, CLS: 0, INP: null };
  const observers = [];
  const observe = (type, callback) => {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe({ type, buffered: true });
      observers.push(observer);
    } catch {
      // Unsupported performance entry types are omitted.
    }
  };
  observe('largest-contentful-paint', (entries) => {
    for (const entry of entries) values.LCP = entry.startTime;
  });
  observe('layout-shift', (entries) => {
    for (const entry of entries) if (!entry.hadRecentInput) values.CLS += entry.value;
  });
  observe('event', (entries) => {
    for (const entry of entries) {
      if (entry.interactionId && entry.duration > (values.INP || 0)) values.INP = entry.duration;
    }
  });

  let sent = false;
  const send = () => {
    if (sent) return;
    sent = true;
    const route = routePattern(window.location.pathname);
    for (const name of ['LCP', 'CLS', 'INP']) {
      if (values[name] === null) continue;
      track('web_vital', { name, bucket: metricBucket(name, values[name]), route });
    }
    flushAnalytics();
  };
  window.addEventListener('pagehide', send);
  return () => {
    window.removeEventListener('pagehide', send);
    for (const observer of observers) observer.disconnect();
  };
}
