import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Every dropdown option, active or not, for the admin edit form (a member may already hold one
// the admin later deactivated, and the edit screen needs to keep showing it).
export function useAdminOptions() {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(null);

  const [raw, setRaw] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { items } = await api('/admin/options');
      const grouped = { category: [], niche: [], location: [], collabInterest: [] };
      const rawGrouped = { category: [], niche: [], location: [], collabInterest: [] };
      for (const o of items) {
        grouped[o.type] ??= [];
        rawGrouped[o.type] ??= [];
        grouped[o.type].push({ id: o.id, label: o.active ? o.label : `${o.label} (inactive)` });
        rawGrouped[o.type].push(o);
      }
      setOptions(grouped);
      setRaw(rawGrouped);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // `options`: {id,label} pairs for select dropdowns, inactive ones marked in the label.
  // `raw`: full option objects (id, label, active, type) for the management screen.
  return { options, raw, error, reload: load };
}
