import { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Lock,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button, Card, CardHeader, SeverityBadge, ProgressBar, SectionHeader } from '../ui/primitives';
import { CopyButton, HashDisplay } from '../ui/overlays';
import { AttackBadge, Timeline, IocTag } from '../ui/domain';
import { getSepoliaBlockUrl } from '../../threatData';

export function ConsensusValidationPage({
  pending = [],
  onApprove,
  onReject,
  role = 'uploader',
  onInspectProof,
  onNavigateToExplorer,
}) {
  const [solutions, setSolutions] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [banner, setBanner] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  async function handleApproveClick(report) {
    setBusyId(report.id);
    const sol = solutions[report.id] || report.solution;
    const res = await onApprove(report, { solution: sol });
    setBusyId(null);
    setBanner({
      type: 'success',
      title: 'Consensus Quorum Reached & Anchored On-Chain',
      message: `Incident for "${report.organization}" successfully anchored to Ethereum Sepolia. +25 CTIX rewarded.`,
      txHash: res.txHash,
      blockNumber: res.blockNumber,
      record: res.record,
    });
  }

  async function handleRejectClick(report) {
    setBusyId(report.id);
    await onReject(report);
    setBusyId(null);
    setBanner({
      type: 'info',
      title: 'Report Rejected by Administrator',
      message: `Incident for "${report.organization}" was archived off-chain and will not be anchored.`,
    });
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <SectionHeader
        eyebrow="Decentralized Multi-Node Consensus"
        title="Validator Consensus &amp; Quorum Verification"
        description="Consortium nodes evaluate threat evidence, verify cryptographic privacy hashes, and cast on-chain approval votes to commit incident telemetry to Ethereum Sepolia."
      />

      {/* Consensus Notification Banner */}
      {banner && (
        <Card className="p-4 border-ok/30 bg-ok/10 animate-fade-up">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-ok shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-fg">{banner.title}</h4>
                <p className="text-xs text-muted mt-0.5">{banner.message}</p>
                {banner.txHash && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-accent">
                      TX: {banner.txHash.slice(0, 18)}...
                    </span>
                    <a
                      href={getSepoliaBlockUrl(banner.blockNumber)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-mono text-xs text-ok hover:underline"
                    >
                      <span>Sepolia Block #{banner.blockNumber}</span>
                      <ExternalLink className="size-3" />
                    </a>
                    {banner.record && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => onInspectProof(banner.record)}
                        icon={ShieldCheck}
                      >
                        Inspect On-Chain Proof
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-subtle hover:text-fg text-xs"
            >
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Validator Quorum Status Strip */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
          <div>
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Consortium Validator Network
            </span>
            <h3 className="text-lg font-bold text-fg mt-1">Consensus Voting &amp; Quorum Engine</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-xs font-mono text-ok">80% Supermajority Required</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quorum Progress Bar */}
          <div className="flex flex-col gap-3">
            <ProgressBar
              value={4}
              max={5}
              label="Consortium Node Quorum Status (4 of 5 Validators Voted)"
              showValue
              tone="gradient"
              size="lg"
            />
            <p className="text-xs text-muted">
              4 of 5 consortium security nodes have verified SHA-256 telemetry hashes and attested zero PII leakage. Quorum threshold met.
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { name: 'Apex Financial', status: 'Voted YES', tone: 'ok' },
                { name: 'CloudScale Telecom', status: 'Voted YES', tone: 'ok' },
                { name: 'BioGenetics Labs', status: 'Voted YES', tone: 'ok' },
                { name: 'Quantum Defense', status: 'Voted YES', tone: 'ok' },
                { name: 'FinTech Nexus', status: 'Pending Vote', tone: 'warn' },
              ].map((v) => (
                <div
                  key={v.name}
                  className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs"
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      v.tone === 'ok' ? 'bg-ok' : 'bg-warn'
                    }`}
                  />
                  <span className="text-fg font-medium">{v.name}</span>
                  <span className="text-[10px] text-subtle font-mono">({v.status})</span>
                </div>
              ))}
            </div>
          </div>

          {/* On-Chain Transaction Status Timeline */}
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface/50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-subtle mb-2">
              On-Chain Transaction Lifecycle Timeline:
            </span>
            <Timeline
              steps={[
                {
                  label: 'Evidence Ingestion & SHA-256 Hashing',
                  description: 'Telemetry records evaluated and privacy shield created.',
                  state: 'done',
                  meta: 'Step 1',
                },
                {
                  label: 'Explainable AI Feature Attribution',
                  description: 'SHAP decomposition & 98.4% malicious confidence verified.',
                  state: 'done',
                  meta: 'Step 2',
                },
                {
                  label: 'Validator Quorum Voting',
                  description: 'Consortium nodes vote and authorize smart contract state commit.',
                  state: 'active',
                  meta: 'Step 3',
                },
                {
                  label: 'Sepolia Block Finalization',
                  description: 'Merkle root committed to ThreatReportLedger.sol with +25 CTIX reward.',
                  state: 'todo',
                  meta: 'Step 4',
                },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Pending Reports Queue */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-fg">Pending Evidence Awaiting Consensus</h3>
            <p className="text-xs text-muted">
              {pending.length} reports staged for validator review and administrator confirmation
            </p>
          </div>

          {role === 'admin' ? (
            <span className="rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
              Administrator Clearance Active
            </span>
          ) : (
            <span className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted">
              Read-Only Reviewer Mode
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <Card className="p-12 text-center text-muted">
            <ClipboardCheck className="mx-auto size-10 text-subtle mb-3" />
            <strong className="text-base text-fg block">No reports awaiting consensus</strong>
            <span className="text-xs text-muted">
              All incident submissions have reached quorum and been committed to Ethereum Sepolia.
            </span>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((report) => {
              const isExpanded = expandedId === report.id;
              const isBusy = busyId === report.id;
              const metrics = report.metrics || report.summary?.metrics || { accuracy: 0.985 };

              return (
                <Card key={report.id} className="p-6 flex flex-col gap-4">
                  {/* Top Row */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-semibold text-fg">
                          {report.organization}
                        </h4>
                        <AttackBadge type={report.attack_type} />
                        <SeverityBadge severity={report.severity || 'HIGH'} />
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Submitted by {report.submitted_by || 'SOC Operator'} ·{' '}
                        {Number(report.record_count || 0).toLocaleString()} evaluated telemetry flows
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-warn/30 bg-warn/10 px-2.5 py-0.5 text-xs font-medium text-warn flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-warn animate-pulse" />
                        <span>Awaiting Admin Quorum</span>
                      </span>

                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => toggleExpand(report.id)}
                      >
                        {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Hashes Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-line bg-surface p-2.5">
                      <span className="text-[10px] font-medium text-subtle uppercase">
                        Report Digest (SHA-256)
                      </span>
                      <div className="flex items-center justify-between font-mono text-xs text-accent mt-0.5">
                        <span className="truncate">{report.report_hash}</span>
                        <CopyButton value={report.report_hash} label="Report Hash" />
                      </div>
                    </div>

                    <div className="rounded-lg border border-line bg-surface p-2.5">
                      <span className="text-[10px] font-medium text-subtle uppercase">
                        Sensitive Data Mask
                      </span>
                      <div className="flex items-center justify-between font-mono text-xs text-ok mt-0.5">
                        <span className="truncate">{report.sensitive_data_hash || report.report_hash}</span>
                        <CopyButton value={report.sensitive_data_hash || report.report_hash} label="Privacy Hash" />
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="flex flex-col gap-3 border-t border-line pt-3 animate-fade-up">
                      {report.top_indicators && report.top_indicators.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-subtle uppercase block mb-1.5">
                            Extracted Threat Indicators:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {report.top_indicators.map((ind, i) => (
                              <IocTag key={i} value={ind} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mitigation Playbook Editor */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-subtle mb-1.5">
                          <span>VERIFIED MITIGATION PLAYBOOK (COMMITTED UPON APPROVAL)</span>
                          <CopyButton value={solutions[report.id] || report.solution || ''} label="Playbook" />
                        </div>
                        <textarea
                          rows={4}
                          value={solutions[report.id] ?? report.solution ?? ''}
                          onChange={(e) =>
                            setSolutions((prev) => ({ ...prev, [report.id]: e.target.value }))
                          }
                          disabled={role !== 'admin'}
                          className="w-full rounded-xl border border-line bg-bg p-3 font-mono text-xs text-muted focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions for Admin */}
                  {role === 'admin' ? (
                    <div className="flex items-center justify-end gap-3 border-t border-line pt-3">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isBusy}
                        loading={isBusy}
                        onClick={() => handleRejectClick(report)}
                        icon={XCircle}
                      >
                        Reject
                      </Button>

                      <Button
                        size="sm"
                        variant="gradient"
                        disabled={isBusy}
                        loading={isBusy}
                        onClick={() => handleApproveClick(report)}
                        iconRight={CheckCircle2}
                      >
                        Approve &amp; Anchor to Sepolia (+25 CTIX)
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-subtle border-t border-line pt-2">
                      Sign in as System Administrator to vote and execute blockchain anchoring.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
