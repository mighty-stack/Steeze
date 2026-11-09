import { matchPath } from 'react-router-dom';
import { ANALYTICS_ROUTES } from './events.js';

export function routePattern(pathname) {
  const pattern = ANALYTICS_ROUTES.find((path) => path !== '/unknown' && matchPath({ path, end: true }, pathname));
  if (!pattern && import.meta.env.DEV) console.warn('[analytics] No route pattern configured for this page.');
  return pattern || '/unknown';
}
