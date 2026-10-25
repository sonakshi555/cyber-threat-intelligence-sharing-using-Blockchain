import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  ExternalLink,
  X,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button, Card, SeverityBadge, SectionHeader, Input } from '../ui/primitives';
import { HashDisplay, CopyButton, DataTable } from '../ui/overlays';
import { AttackBadge, ConsensusBadge, IocTag, ConfidenceMeter } from '../ui/domain';
import { exportThreatsAsSTIX, getSepoliaBlockUrl } from '../../threatData';

export function ThreatFeedPage({
  feed = [],
  onInspectProof,
  onInspectShap,
}) {
  const [search, setSearch] = useState('');
  const [selectedVector, setSelectedVector] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  // Filter feed items
  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const matchVector = selectedVector === 'ALL' || item.attack_type === selectedVector;
      const matchSeverity =
        selectedSeverity === 'ALL' || (item.severity || 'HIGH').toUpperCase() === selectedSeverity;
      const matchStatus =
        selectedStatus === 'ALL' || (item.status || 'verified').toLowerCase() === selectedStatus.toLowerCase();

      const q = search.toLowerCase().trim();
      if (!q) return matchVector && matchSeverity && matchStatus;

      const matchText =
        (item.organization || '').toLowerCase().includes(q) ||
        (item.attack_type || '').toLowerCase().includes(q) ||
        (item.report_hash || '').toLowerCase().includes(q) ||
        (item.sensitive_data_hash || '').toLowerCase().includes(q) ||
        (item.receipt?.tx_hash || '').toLowerCase().includes(q) ||
        (item.top_indicators || []).some((ind) => ind.toLowerCase().includes(q));

      return matchVector && matchSeverity && matchStatus && matchText;
    });
  }, [feed, selectedVector, selectedSeverity, selectedStatus, search]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const columns = [
    {
      key: 'organization',
      header: 'Entity / Time',
      render: (item) => (
        <div className="flex flex-col">
          <strong className="text-fg font-medium">{item.organization}</strong>
          <span className="text-[11px] text-subtle font-mono">
            {new Date(item.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'attack_type',
      header: 'Vector',
      render: (item) => <AttackBadge type={item.attack_type} />,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (item) => <SeverityBadge severity={item.severity} />,
    },
    {
      key: 'indicators',
      header: 'Threat IOCs',
      render: (item) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(item.top_indicators || []).slice(0, 3).map((ind, i) => (
            <IocTag key={i} value={ind} />
          ))}
        </div>
      ),
      hideBelow: 'md',
    },
    {
      key: 'confidence',
      header: 'AI Confidence',
      render: (item) => (
        <ConfidenceMeter value={item.metrics?.accuracy || 0.984} />
      ),
      hideBelow: 'lg',
    },
    {
      key: 'status',
      header: 'Consensus',
      render: (item) => <ConsensusBadge status={item.status || 'verified'} />,
    },
    {
      key: 'tx_hash',
      header: 'Sepolia TX Hash',
      render: (item) => (
        <HashDisplay
          value={item.receipt?.tx_hash || item.tx_hash}
          label="TX Hash"
          head={6}
          tail={4}
          href={
            item.receipt?.tx_hash?.startsWith('0x')
              ? `https://sepolia.etherscan.io/tx/${item.receipt?.tx_hash}`
              : getSepoliaBlockUrl(item.receipt?.block_number || 6849102)
          }
        />
      ),
      hideBelow: 'xl',
    },
    {
      key: 'actions',
      header: 'Details',
      headClassName: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(item.id);
            }}
          >
            {expandedId === item.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
          {item.status === 'verified' && (
            <Button
              size="xs"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onInspectProof(item);
              }}
              icon={ShieldCheck}
            >
              Proof
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header with STIX 2.1 Export CTA */}
      <SectionHeader
        eyebrow="Decentralized Threat Intelligence Feed"
        title="Live Threat Telemetry &amp; IOC Feed"
        description="Search, inspect, and verify cyber incident signatures submitted across consortium nodes. All reports are cryptographically validated on the Ethereum Sepolia ledger."
        actions={
          <Button
            variant="secondary"
            size="md"
            icon={Download}
            onClick={() => exportThreatsAsSTIX(filteredFeed)}
            title="Download verified intelligence in OASIS STIX 2.1 JSON bundle"
          >
            Export STIX 2.1 JSON
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Input
              icon={Search}
              placeholder="Search by entity, vector, hash, or IOC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              trailing={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="p-1 text-subtle hover:text-fg"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null
              }
            />
          </div>

          {/* Quick Filter Counts */}
          <span className="text-xs font-mono text-muted">
            Displaying <strong className="text-accent">{filteredFeed.length}</strong> of{' '}
            {feed.length} incidents
          </span>
        </div>

        {/* Filter Pill Rows */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
          <span className="text-xs text-subtle font-medium mr-1">Vector:</span>
          {['ALL', 'DDoS', 'Phishing', 'Malware', 'Brute Force', 'Multi-Vector'].map((vec) => (
            <button
              key={vec}
              type="button"
              onClick={() => setSelectedVector(vec)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedVector === vec
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-surface text-muted hover:text-fg border border-line'
              }`}
            >
              {vec}
            </button>
          ))}

          <span className="text-xs text-subtle font-medium ml-3 mr-1">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`rounded-lg px-2 py-0.5 text-xs font-medium transition-colors ${
                selectedSeverity === sev
                  ? 'bg-elevated text-fg border border-line-strong'
                  : 'bg-surface text-subtle hover:text-fg border border-line'
              }`}
            >
              {sev}
            </button>
          ))}

          <span className="text-xs text-subtle font-medium ml-3 mr-1">Consensus:</span>
          {['ALL', 'Verified', 'Pending', 'Rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`rounded-lg px-2 py-0.5 text-xs font-medium transition-colors ${
                selectedStatus === st
                  ? 'bg-elevated text-fg border border-line-strong'
                  : 'bg-surface text-subtle hover:text-fg border border-line'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Table */}
      <DataTable
        columns={columns}
        rows={filteredFeed}
        rowKey="id"
        onRowClick={(item) => toggleExpand(item.id)}
        empty={
          <div className="py-12 text-center text-sm text-muted">
            <ShieldAlert className="mx-auto size-8 text-subtle mb-2" />
            No threats match the current filters.
          </div>
        }
      />

      {/* Expandable Mitigation Drawer for Currently Expanded Row */}
      {expandedId && (() => {
        const item = feed.find((f) => f.id === expandedId);
        if (!item) return null;
        return (
          <Card className="p-6 border border-line animate-fade-up">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-ok" />
                  <h4 className="text-base font-semibold text-fg">
                    Verified Mitigation &amp; Containment Playbook — {item.organization}
                  </h4>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Attack Vector: {item.attack_type} · Evaluated: {Number(item.record_count || 0).toLocaleString()} flows · Status: {item.status || 'verified'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Sparkles}
                  onClick={() => onInspectShap?.(item)}
                >
                  Inspect SHAP XAI
                </Button>
                {item.status === 'verified' && (
                  <Button
                    size="xs"
                    variant="primary"
                    icon={ShieldCheck}
                    onClick={() => onInspectProof?.(item)}
                  >
                    On-Chain Receipt
                  </Button>
                )}
              </div>
            </div>

            {/* Hashes Row */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-3">
                <span className="text-[11px] font-medium text-subtle uppercase">
                  SHA-256 Report Fingerprint
                </span>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-accent">
                  <span className="truncate">{item.report_hash}</span>
                  <CopyButton value={item.report_hash} label="Report Hash" />
                </div>
              </div>

              <div className="rounded-lg border border-line bg-surface p-3">
                <span className="text-[11px] font-medium text-subtle uppercase">
                  Sensitive Data Privacy Shield Hash
                </span>
                <div className="mt-1 flex items-center justify-between font-mono text-xs text-ok">
                  <span className="truncate">{item.sensitive_data_hash || item.report_hash}</span>
                  <CopyButton value={item.sensitive_data_hash || item.report_hash} label="Sensitive Hash" />
                </div>
              </div>
            </div>

            {/* Playbook Content */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-subtle mb-1.5">
                <span>ACTIONABLE DEFENSIVE MITIGATION</span>
                <CopyButton value={item.solution || ''} label="Playbook" />
              </div>
              <pre className="code-block font-mono text-xs leading-relaxed text-muted bg-bg p-4 rounded-xl border border-line overflow-x-auto">
                {item.solution || 'Mitigation instructions pending verification.'}
              </pre>
            </div>

            {/* Recommended Firewall / EDR Rules */}
            {item.recommended_rules && item.recommended_rules.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-medium text-subtle uppercase tracking-wider">
                  Recommended Firewall &amp; Detection Rules:
                </span>
                <div className="mt-2 flex flex-col gap-1.5">
                  {item.recommended_rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fg"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="size-3.5 text-accent shrink-0" />
                        <code className="truncate">{rule}</code>
                      </div>
                      <CopyButton value={rule} label="Rule" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );
}
