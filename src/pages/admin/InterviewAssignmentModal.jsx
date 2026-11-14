import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, qs } from '../../api/client.js';
import { Button, Modal, Pill, Splash } from '../../components/ui.jsx';

const PAGE_SIZE = 20;
const CANDIDATE_KINDS = [
  { value: 'none', label: 'Not queued' },
  { value: 'waived', label: 'Waived' },
  { value: 'unassigned', label: 'Unassigned' },
];

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatSkippedReason(item) {
  return `${item.name}: ${item.reason}`;
}

export default function InterviewAssignmentModal({
  creatorIds,
  creatorName,
  includeWaived = false,
  onClose,
  onComplete,
}) {
  const fixedCreatorIds = Array.isArray(creatorIds) ? creatorIds : null;
  const isSingleCreator = Boolean(fixedCreatorIds?.length);
  const [kind, setKind] = useState(includeWaived ? 'waived' : 'none');
  const [verification, setVerification] = useState('');
  const [cohort, setCohort] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search.trim());
  const [page, setPage] = useState(1);
  const [candidates, setCandidates] = useState(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set(fixedCreatorIds || []));
  const [allMatching, setAllMatching] = useState(false);
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');
  const [mode, setMode] = useState('individual');
  const [interviewerId, setInterviewerId] = useState('');
  const [staffIds, setStaffIds] = useState([]);
  const [ignoreCap, setIgnoreCap] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [overrideCap, setOverrideCap] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewInput, setPreviewInput] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const candidateRequest = useRef(0);

  const resetPreview = () => {
    setPreview(null);
    setPreviewInput(null);
    setOverrideCap(false);
    setError('');
  };

  const loadCandidates = useCallback(async () => {
    if (isSingleCreator) return;
    const requestId = ++candidateRequest.current;
    setCandidateLoading(true);
    setCandidateError('');
    try {
      const data = await api(`/admin/interviews/candidates${qs({
        kind,
        verification: verification || undefined,
        cohort: cohort.trim() || undefined,
        q: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      })}`);
      if (requestId === candidateRequest.current) setCandidates(data);
    } catch (loadError) {
      if (requestId === candidateRequest.current) setCandidateError(loadError.message || 'Could not load interview candidates.');
    } finally {
      if (requestId === candidateRequest.current) setCandidateLoading(false);
    }
  }, [cohort, debouncedSearch, isSingleCreator, kind, page, verification]);

  useEffect(() => { void loadCandidates(); }, [loadCandidates]);

  useEffect(() => {
    let active = true;
    api(`/admin/staff${qs({ status: 'active', page: 1, limit: 100 })}`)
      .then((data) => {
        if (!active) return;
        const activeStaff = (data.items || []).filter((item) => item.status === 'active');
        setStaff(activeStaff);
        setInterviewerId((current) => current || activeStaff[0]?.id || '');
      })
      .catch((loadError) => {
        if (active) setStaffError(loadError.message || 'Could not load active staff.');
      })
      .finally(() => {
        if (active) setStaffLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filter = useMemo(() => ({
    interview: kind,
    ...(verification ? { verification } : {}),
    ...(cohort.trim() ? { cohort: cohort.trim() } : {}),
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
  }), [cohort, debouncedSearch, kind, verification]);

  const requestBody = useMemo(() => {
    const selection = isSingleCreator
      ? { creatorIds: fixedCreatorIds }
      : allMatching
        ? { filter, limit: 500 }
        : { creatorIds: [...selectedIds] };
    const target = mode === 'individual'
      ? { interviewerId }
      : { auto: { staffIds, ignoreCap } };
    return {
      ...selection,
      ...target,
      overwrite,
      includeWaived: kind === 'waived' || includeWaived,
      overrideCap,
      notifyCreators: true,
    };
  }, [allMatching, filter, fixedCreatorIds, ignoreCap, includeWaived, interviewerId, isSingleCreator, kind, mode, overrideCap, overwrite, selectedIds, staffIds]);

  const canPreview = Boolean(
    (isSingleCreator || allMatching || selectedIds.size)
    && (mode === 'individual' ? interviewerId : staffIds.length),
  );
  const matchingIds = (candidates?.items || []).map((item) => item.id);
  const allVisibleSelected = matchingIds.length > 0 && matchingIds.every((id) => selectedIds.has(id));
  const selectedCount = isSingleCreator
    ? fixedCreatorIds.length
    : allMatching
      ? candidates?.total || 0
      : selectedIds.size;

  const updateCandidateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
    setSelectedIds(new Set());
    setAllMatching(false);
    resetPreview();
  };

  const changeKind = (value) => {
    setKind(value);
    setPage(1);
    setSelectedIds(new Set());
    setAllMatching(false);
    resetPreview();
  };

  const toggleVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) matchingIds.forEach((id) => next.delete(id));
      else {
        const remaining = Math.max(0, 100 - next.size);
        matchingIds.filter((id) => !next.has(id)).slice(0, remaining).forEach((id) => next.add(id));
      }
      return next;
    });
    resetPreview();
  };

  const toggleCreator = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < 100) next.add(id);
      return next;
    });
    resetPreview();
  };

  const previewAssignment = async () => {
    setBusy('preview');
    setError('');
    try {
      const result = await api('/admin/interviews/assign-creators/preview', {
        method: 'POST',
        body: requestBody,
      });
      setPreview(result);
      setPreviewInput(requestBody);
    } catch (previewError) {
      setError(previewError.message || 'Could not preview this assignment.');
    } finally {
      setBusy('');
    }
  };

  const runAssignment = async () => {
    if (!preview || !previewInput) return;
    setBusy('apply');
    setError('');
    try {
      const result = await api('/admin/interviews/assign-creators', {
        method: 'POST',
        body: {
          ...previewInput,
          overrideCap,
          expectedCount: preview.total,
        },
      });
      await onComplete?.(result);
      onClose();
    } catch (runError) {
      setError(runError.message || 'Could not apply this assignment.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Modal
      title={isSingleCreator ? `Assign ${creatorName || 'creator'} to an interviewer` : 'Bulk assign creator interviews'}
      onClose={onClose}
      wide
      footer={(
        <>
          <button className="btn line" type="button" onClick={onClose} disabled={Boolean(busy)}>Cancel</button>
          {preview ? (
            <Button
              className="primary"
              type="button"
              loading={busy === 'apply'}
              disabled={preview.capWarnings?.length > 0 && !overrideCap}
              onClick={runAssignment}
            >
              Apply assignment
            </Button>
          ) : (
            <Button className="primary" type="button" loading={busy === 'preview'} disabled={!canPreview} onClick={previewAssignment}>
              Preview assignment
            </Button>
          )}
        </>
      )}
    >
      {!isSingleCreator && (
        <>
          <div className="tabs" role="tablist" aria-label="Interview candidate type">
            {CANDIDATE_KINDS.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={kind === item.value}
                className={kind === item.value ? 'on' : ''}
                key={item.value}
                onClick={() => changeKind(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="interview-assignment-filters">
            <label className="field">
              <span>Search creator</span>
              <input className="input" value={search} onChange={updateCandidateFilter(setSearch)} placeholder="Name, email or handle" />
            </label>
            <label className="field">
              <span>Verification</span>
              <select className="input" value={verification} onChange={updateCandidateFilter(setVerification)}>
                <option value="">All verification states</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="field">
              <span>Cohort</span>
              <input className="input" value={cohort} onChange={updateCandidateFilter(setCohort)} placeholder="Any cohort" />
            </label>
          </div>
          {candidateError && <p className="form-error" role="alert">{candidateError}</p>}
          {candidateLoading && !candidates ? <Splash /> : (
            <>
              <div className="interview-candidate-toolbar">
                <label className="interview-select-all">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} />
                  <span>Select this page</span>
                </label>
                <label className="interview-select-all">
                  <input
                    type="checkbox"
                    checked={allMatching}
                    onChange={(event) => {
                      setAllMatching(event.target.checked);
                      setSelectedIds(new Set());
                      resetPreview();
                    }}
                  />
                  <span>Select all {candidates?.total || 0} matching creators (max 500)</span>
                </label>
              </div>
              {candidateLoading && <p className="muted">Refreshing candidates…</p>}
              <div className="interview-candidate-list">
                {(candidates?.items || []).map((item) => (
                  <label className="interview-candidate-row" key={item.id}>
                    <input
                      type="checkbox"
                      checked={allMatching || selectedIds.has(item.id)}
                      disabled={allMatching}
                      onChange={() => toggleCreator(item.id)}
                    />
                    <span className="interview-candidate-main">
                      <strong>{item.name || 'Creator'}</strong>
                      <small>{[item.niche, item.location, item.cohort].filter(Boolean).join(' · ') || 'Profile details unavailable'}</small>
                    </span>
                    <span className="interview-candidate-meta">
                      <Pill tone={item.verificationStatus === 'verified' ? 'ok' : 'wait'}>{item.verificationStatus || 'unknown'}</Pill>
                      {item.legacy && <Pill tone="off">Legacy</Pill>}
                    </span>
                  </label>
                ))}
                {!candidates?.items?.length && !candidateLoading && <p className="muted">No candidates match these filters.</p>}
              </div>
              {candidates?.total > PAGE_SIZE && (
                <div className="interview-candidate-pagination">
                  <button className="link" type="button" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); resetPreview(); }}>Previous</button>
                  <span>Page {page} of {candidates.pages}</span>
                  <button className="link" type="button" disabled={page >= candidates.pages} onClick={() => { setPage((value) => value + 1); resetPreview(); }}>Next</button>
                </div>
              )}
              {selectedIds.size >= 100 && !allMatching && <p className="muted">Individual selection is limited to 100. Use “Select all matching” for a filtered batch.</p>}
            </>
          )}
        </>
      )}

      <section className="interview-assignment-target">
        <h3>Assignment method</h3>
        <div className="interview-assignment-modes">
          <label><input type="radio" name="assignment-mode" checked={mode === 'individual'} onChange={() => { setMode('individual'); resetPreview(); }} /> Assign to one interviewer</label>
          <label><input type="radio" name="assignment-mode" checked={mode === 'auto'} onChange={() => { setMode('auto'); resetPreview(); }} /> Spread across selected staff</label>
        </div>
        {staffError && <p className="form-error" role="alert">{staffError}</p>}
        {staffLoading && <p className="muted">Loading active staff…</p>}
        {!staffLoading && !staff.length && !staffError && <p className="muted">No active staff members are available.</p>}
        {mode === 'individual' ? (
          <label className="field">
            <span>Active interviewer</span>
            <select className="input" value={interviewerId} onChange={(event) => { setInterviewerId(event.target.value); resetPreview(); }} disabled={!staff.length}>
              <option value="">Choose an interviewer</option>
              {staff.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.openInterviews || 0} open</option>)}
            </select>
          </label>
        ) : (
          <div className="interview-staff-selection">
            {staff.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={staffIds.includes(item.id)}
                  disabled={!staffIds.includes(item.id) && staffIds.length >= 50}
                  onChange={(event) => {
                    setStaffIds((current) => event.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id));
                    resetPreview();
                  }}
                />
                <span>{item.name}<small>{item.openInterviews || 0} open interviews</small></span>
              </label>
            ))}
            <label className="interview-cap-toggle">
              <input type="checkbox" checked={ignoreCap} onChange={(event) => { setIgnoreCap(event.target.checked); resetPreview(); }} />
              <span>Allow the batch to exceed staff capacity</span>
            </label>
          </div>
        )}
        {!isSingleCreator && (
          <p className="muted">Selected: {selectedCount}. Filtered batches are limited to 500 creators.</p>
        )}
        <label className="interview-cap-toggle">
          <input type="checkbox" checked={overwrite} onChange={(event) => { setOverwrite(event.target.checked); resetPreview(); }} />
          <span>Reassign creators who already have an interviewer</span>
        </label>
      </section>

      {preview && (
        <section className="interview-assignment-preview" aria-live="polite">
          <h3>Preview</h3>
          <p>{preview.total} creator{preview.total === 1 ? '' : 's'} matched · {preview.assigned + preview.reassigned} assignment{preview.assigned + preview.reassigned === 1 ? '' : 's'} planned · {preview.skipped.length} skipped</p>
          <div className="interview-assignment-preview-staff">
            {preview.perStaff?.map((item) => (
              <div key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.openBefore} → {item.openAfter} open · {item.assigned} assigned{item.cap ? ` · cap ${item.cap}` : ''}</span>
              </div>
            ))}
          </div>
          {!!preview.capWarnings?.length && (
            <div className="interview-cap-warning">
              <strong>Capacity confirmation required</strong>
              {preview.capWarnings.map((item) => <p key={item.id}>{item.name}: {item.projectedLoad} open against a cap of {item.cap}.</p>)}
              <label className="interview-cap-toggle">
                <input type="checkbox" checked={overrideCap} onChange={(event) => setOverrideCap(event.target.checked)} />
                <span>I confirm assigning above the staff capacity limit.</span>
              </label>
            </div>
          )}
          {!!preview.skipped?.length && (
            <details>
              <summary>Skipped creators ({preview.skipped.length})</summary>
              <ul>{preview.skipped.map((item) => <li key={`${item.creatorId}-${item.reason}`}>{formatSkippedReason(item)}</li>)}</ul>
            </details>
          )}
        </section>
      )}
      {error && <div className="form-error" role="alert">{error}</div>}
    </Modal>
  );
}
