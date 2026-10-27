import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client.js';

let cache = null;
const RETRY_DELAYS = [3000, 8000, 15000, 30000];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOptions() {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await api('/options');
    } catch (error) {
      if (!(error instanceof ApiError)
        || ![502, 503, 504].includes(error.status)
        || attempt >= RETRY_DELAYS.length) {
        throw error;
      }
      await wait(RETRY_DELAYS[attempt]);
    }
  }
}

// Dropdown values (categories, niches, locations, interests) from the API, fetched once.
export function useOptions() {
  const [options, setOptions] = useState(cache);
  const [error, setError] = useState(null);

  const load = useCallback(async (force = false) => {
    if (cache && !force) return;
    setError(null);
    try {
      cache = await fetchOptions();
      setOptions(cache);
    } catch (err) {
      setError(err.status === 503
        ? 'Registration options are temporarily unavailable. Please try again shortly.'
        : err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { options, error, reload: () => load(true) };
}

export const clearOptionsCache = () => {
  cache = null;
};
