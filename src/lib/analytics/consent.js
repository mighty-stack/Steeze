const OPT_OUT_KEY = 'analytics_optout';
let browserOptOut = false;
let memberOptOut = false;

export function isAnalyticsOptedOut() {
  try {
    return browserOptOut || memberOptOut || window.localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return browserOptOut || memberOptOut;
  }
}

export function isAnalyticsAllowed() {
  if (isAnalyticsOptedOut()) return false;
  return navigator.doNotTrack !== '1' && navigator.globalPrivacyControl !== true;
}

export function setAnalyticsOptOut(optOut) {
  browserOptOut = Boolean(optOut);
  try {
    if (browserOptOut) window.localStorage.setItem(OPT_OUT_KEY, '1');
    else window.localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // Keep the preference for this page session when browser storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent('clout-analytics-consent-change', { detail: { optOut } }));
}

export function setMemberAnalyticsOptOut(optOut) {
  memberOptOut = Boolean(optOut);
  window.dispatchEvent(new CustomEvent('clout-analytics-consent-change', { detail: { optOut: memberOptOut } }));
}
