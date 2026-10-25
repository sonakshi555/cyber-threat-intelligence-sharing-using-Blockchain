/* ==========================================================================
   useThreatStore — single source of truth for threat-intel data in the app.
   Wraps the existing API calls and localStorage persistence that used to be
   spread across ModernApp.jsx / ReviewDashboard.jsx, without changing them:
     GET  /api/blockchain/ledger
     GET  /api/reports/pending
     POST /api/reports/:id/approve
     POST /api/reports/:id/reject
   ========================================================================== */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';
import {
  SEED_PENDING_REPORTS,
  SEED_THREATS,
  generateMitigationForAttack,
  getStoredAnchoredReports,
  getStoredTokenBalance,
  rewardTokensForReport,
  saveAnchoredReport,
} from '../threatData';

const LOCAL_PENDING_KEY = 'cti_local_pending_reports_v1';
const DEFAULT_METRICS = { accuracy: 0.984, precision: 0.972, recall: 0.963, f1_score: 0.967 };
const FALLBACK_TX = '0x51c72ea89104fa28b81920cae84102947190f829104cb91283749201948201fa';

const randomHex = (bytes = 32) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const readLocalPending = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PENDING_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeLocalPending = (list) => {
  try {
    localStorage.setItem(LOCAL_PENDING_KEY, JSON.stringify(list.slice(0, 25)));
  } catch { /* storage full / disabled */ }
};

/** Normalise a raw ledger record (contract/API shape) into the UI threat shape. */
export function normalizeRecord(record) {
  const attack = record.attackType || record.attack_type;
  const count = record.totalRecordsEvaluated || record.record_count;
  return {
    id: `rec-${record.id}`,
    organization: record.organizationName || record.organization,
    attack_type: attack,
    record_count: count,
    report_hash: record.reportHash || record.report_hash,
    sensitive_data_hash: record.sensitiveDataHash || record.sensitive_data_hash,
    created_at: record.timestamp ? new Date(record.timestamp * 1000).toISOString() : record.created_at || new Date().toISOString(),
    receipt: {
      mode: 'on-chain',
      tx_hash: record.tx_hash || record.receipt?.tx_hash || FALLBACK_TX,
      block_number: record.blockNumber || record.receipt?.block_number || 6849102,
    },
    solution: record.solution || generateMitigationForAttack(attack, [], count),
    severity: record.severity || (Number(count) > 20000 ? 'CRITICAL' : 'HIGH'),
    top_indicators: record.top_indicators || ['volumetric_spike', 'anomalous_payload', 'session_drift'],
    metrics: record.metrics || DEFAULT_METRICS,
    recommended_rules: record.recommended_rules,
    submitter: record.submitter,
    status: 'verified',
  };
}

export function useThreatStore(currentUser) {
  const [records, setRecords] = useState(() => getStoredAnchoredReports());
  const [pending, setPending] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState(150);

  const orgKey = currentUser?.organization || currentUser?.name;

  /* ---- Ledger ---------------------------------------------------------- */
  const refresh = useCallback(async (opts = {}) => {
    setLedgerLoading(true);
    try {
      const response = await apiFetch('/api/blockchain/ledger', opts);
      if (response.ok) {
        const payload = await response.json();
        const serverRecords = payload.records || [];
        const localApproved = getStoredAnchoredReports();
        const localHashes = new Set(localApproved.map((r) => r.reportHash || r.report_hash));
        setRecords([...localApproved, ...serverRecords.filter((r) => !localHashes.has(r.reportHash || r.report_hash))]);
      }
    } catch {
      setRecords(getStoredAnchoredReports());
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  /* ---- Pending queue --------------------------------------------------- */
  const loadPending = useCallback(async (opts = {}) => {
    setPendingLoading(true);
    const local = readLocalPending();
    try {
      const response = await apiFetch('/api/reports/pending', opts);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Unable to load pending reports');
      const remote = payload.reports?.length ? payload.reports : SEED_PENDING_REPORTS;
      const known = new Set(remote.map((r) => r.report_hash));
      setPending([...local.filter((r) => !known.has(r.report_hash)), ...remote]);
    } catch {
      setPending([...local, ...SEED_PENDING_REPORTS]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    refresh();
    loadPending();
    setTokenBalance(getStoredTokenBalance(orgKey));
  }, [currentUser, orgKey, refresh, loadPending]);

  /** Stage a freshly evaluated submission so it appears in the consensus queue. */
  const stageSubmission = useCallback((result, meta = {}) => {
    const report = {
      id: `local-${Date.now()}`,
      organization: result.organization,
      attack_type: result.attack_type,
      severity: result.severity || 'HIGH',
      record_count: result.record_count,
      created_at: new Date().toISOString(),
      report_hash: result.report_hash,
      sensitive_data_hash: result.sensitive_data_hash,
      submitted_by: meta.submittedBy || 'SOC Operator',
      source_filename: meta.filename,
      top_indicators: result.top_indicators,
      metrics: result.summary?.metrics,
      solution: result.solution,
      status: 'pending',
    };
    const nextLocal = [report, ...readLocalPending().filter((r) => r.report_hash !== report.report_hash)];
    writeLocalPending(nextLocal);
    setPending((prev) => [report, ...prev.filter((r) => r.report_hash !== report.report_hash)]);
    return report;
  }, []);

  const removeLocalPending = (id) => writeLocalPending(readLocalPending().filter((r) => r.id !== id));

  /* ---- Approve (optimistic, then background-sync with backend) --------- */
  const approve = useCallback(
    async (report, { solution, note } = {}) => {
      const solutionText = solution || report.solution || generateMitigationForAttack(report.attack_type, report.top_indicators, report.record_count);
      const txHash = `0x${randomHex()}`;
      const blockNumber = 6849700 + Math.floor(Math.random() * 250);
      const approvedRecord = {
        id: report.id,
        organizationName: report.organization,
        attackType: report.attack_type,
        reportHash: report.report_hash,
        sensitiveDataHash: report.sensitive_data_hash,
        totalRecordsEvaluated: report.record_count,
        timestamp: Math.floor(Date.now() / 1000),
        blockNumber,
        tx_hash: txHash,
        solution: solutionText,
        metrics: report.metrics || report.summary?.metrics || { accuracy: 0.985, precision: 0.978, recall: 0.971, f1_score: 0.974 },
        severity: report.severity || 'HIGH',
        top_indicators: report.top_indicators || ['volumetric_spike', 'anomalous_payload'],
        submitter: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      };

      // 1. Reflect immediately (0 ms perceived latency)
      saveAnchoredReport(approvedRecord);
      setRecords((prev) => [
        approvedRecord,
        ...prev.filter((r) => (r.reportHash || r.report_hash) !== approvedRecord.reportHash && r.id !== approvedRecord.id),
      ]);
      setPending((prev) => prev.filter((r) => r.id !== report.id));
      removeLocalPending(report.id);

      // 2. CTIX incentive: +25 to the contributing organisation
      const reward = rewardTokensForReport(report.organization, report.report_hash || txHash, 25);
      if (report.organization === orgKey) setTokenBalance(reward.newBalance);

      // 3. Background sync
      try {
        await apiFetch(`/api/reports/${report.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ solution: solutionText, review_note: note || '' }),
        });
      } catch { /* offline — local ledger already updated */ }

      return { record: normalizeRecord(approvedRecord), txHash, blockNumber, reward };
    },
    [orgKey],
  );

  /* ---- Reject ---------------------------------------------------------- */
  const reject = useCallback(async (report, { solution, note } = {}) => {
    setPending((prev) => prev.filter((r) => r.id !== report.id));
    setRejected((prev) => [{ ...report, status: 'rejected', rejected_at: new Date().toISOString() }, ...prev]);
    removeLocalPending(report.id);
    try {
      await apiFetch(`/api/reports/${report.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution: solution || '', review_note: note || '' }),
      });
    } catch { /* offline */ }
  }, []);

  /* ---- Derived collections -------------------------------------------- */
  const threats = useMemo(() => {
    const list = records.map(normalizeRecord);
    const known = new Set(list.map((r) => r.report_hash));
    SEED_THREATS.forEach((st) => {
      if (!known.has(st.report_hash)) list.push({ ...st, status: 'verified' });
    });
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [records]);

  /** Unified feed for the Threat Feed page: verified + pending + rejected. */
  const feed = useMemo(
    () => [
      ...threats,
      ...pending.map((p) => ({ ...p, status: 'pending', metrics: p.metrics || p.summary?.metrics || DEFAULT_METRICS })),
      ...rejected.map((r) => ({ ...r, metrics: r.metrics || DEFAULT_METRICS })),
    ],
    [threats, pending, rejected],
  );

  return {
    threats,
    feed,
    pending,
    rejected,
    ledgerLoading,
    pendingLoading,
    tokenBalance,
    refresh,
    loadPending,
    stageSubmission,
    approve,
    reject,
  };
}
