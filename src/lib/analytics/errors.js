import { trackClientError } from './track.js';

export function listenForClientErrors() {
  const onError = (event) => trackClientError(event.message || 'Unhandled browser error');
  const onRejection = (event) => {
    const reason = event.reason;
    trackClientError(typeof reason === 'string' ? reason : reason?.message || 'Unhandled promise rejection');
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
