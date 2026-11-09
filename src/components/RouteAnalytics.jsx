import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { routePattern } from '../lib/analytics/routes.js';
import { track } from '../lib/analytics/track.js';
import { listenForClientErrors } from '../lib/analytics/errors.js';
import { observeWebVitals } from '../lib/analytics/vitals.js';

export default function RouteAnalytics() {
  const location = useLocation();
  const lastView = useRef({ route: '', at: 0 });

  useEffect(() => {
    const route = routePattern(location.pathname);
    const now = Date.now();
    if (lastView.current.route === route && now - lastView.current.at < 1000) return;
    lastView.current = { route, at: now };
    track('page_view', { route });
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const stopErrors = listenForClientErrors();
    const stopVitals = observeWebVitals();
    return () => {
      stopErrors();
      stopVitals();
    };
  }, []);

  return null;
}
