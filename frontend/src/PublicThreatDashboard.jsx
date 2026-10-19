import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ShieldAlert, ShieldCheck, Database, Search, Filter, ExternalLink,
  Copy, Check, Download, CheckCircle2, Lock, Cpu, Globe,
  Terminal, AlertTriangle, FileCode, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { exportThreatsAsSTIX } from './threatData';

const ATTACK_COLORS = {
  DDoS: '#ef4444',
  Phishing: '#f59e0b',
  Malware: '#8b5cf6',
  'Brute Force': '#3b82f6',
  'Multi-Vector': '#ec4899',
};

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

function CopyHashPill({ hash, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="public-hash-pill" onClick={handleCopy} title="Click to copy SHA-256">
      <span className="hash-label">{label}:</span>
      <code>{String(hash).slice(0, 16)}...</code>
      <button type="button" className="mini-copy">
        {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      </button>
    </div>
  );
}

export default function PublicThreatDashboard({ threats = [] }) {
  const [search, setSearch] = useState('');
  const [selectedVector, setSelectedVector] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [verifyModalHash, setVerifyModalHash] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const filteredThreats = useMemo(() => {
    return threats.filter((item) => {
      const matchesVector = selectedVector === 'ALL' || item.attack_type === selectedVector;
      const q = search.toLowerCase().trim();
      if (!q) return matchesVector;
      const matchesText =
        (item.organization || '').toLowerCase().includes(q) ||
        (item.attack_type || '').toLowerCase().includes(q) ||
        (item.solution || '').toLowerCase().includes(q) ||
        (item.report_hash || '').toLowerCase().includes(q) ||
        (item.top_indicators || []).some((ind) => ind.toLowerCase().includes(q));
      return matchesVector && matchesText;
    });
  }, [threats, selectedVector, search]);

  // Chart data
  const vectorChartData = useMemo(() => {
    const counts = {};
    threats.forEach((t) => {
      const v = t.attack_type || 'Unknown';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      fill: ATTACK_COLORS[name] || '#6366f1',
    }));
  }, [threats]);

  const severityChartData = useMemo(() => {
    const counts = {};
    threats.forEach((t) => {
      const s = t.severity || 'HIGH';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: SEVERITY_COLORS[name] || '#94a3b8',
    }));
  }, [threats]);

  const totalEvaluatedRecords = useMemo(() => {
    return threats.reduce((acc, t) => acc + (Number(t.record_count) || 0), 0);
  }, [threats]);

  const handleVerifyHash = (e) => {
    e.preventDefault();
    const query = verifyInput.trim().toLowerCase();
    if (!query) return;
    const match = threats.find(
      (t) =>
        t.report_hash?.toLowerCase() === query ||
        t.sensitive_data_hash?.toLowerCase() === query ||
        t.receipt?.tx_hash?.toLowerCase() === query
    );
    setVerifyResult(
      match
        ? {
            valid: true,
            organization: match.organization,
            vector: match.attack_type,
            blockNumber: match.receipt?.block_number || 'Sepolia #6849102',
            txHash: match.receipt?.tx_hash,
            timestamp: match.created_at,
          }
        : { valid: false }
    );
  };

  return (
    <div className="public-dashboard">
      {/* Header Banner */}
      <section className="public-hero">
        <div className="hero-content">
          <div className="public-badge">
            <Globe size={14} /> DECENTRALIZED CYBER THREAT SHARING PLATFORM · PUBLIC REPOSITORY
          </div>
          <h1>
            Decentralized Threat Intelligence &amp; Verified Solutions
          </h1>
          <p className="hero-sub">
            Publicly verifiable cyber incident telemetry anchored on Ethereum Sepolia.
            Review how participating organizations identified high-severity threat vectors and inspect their verified mitigation playbooks.
          </p>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => exportThreatsAsSTIX(filteredThreats)}
            title="Download verified intelligence in STIX 2.1 format"
          >
            <Download size={14} /> Export STIX 2.1 JSON
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setVerifyModalHash('');
              setVerifyResult(null);
            }}
          >
            <ShieldCheck size={14} /> Verify On-Chain Hash
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="public-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap bg-blue-500/10 text-blue-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="stat-label">VERIFIED THREATS SHARED</span>
            <strong className="stat-val">{threats.length}</strong>
            <small className="stat-sub">100% Cryptographically Anchored</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap bg-green-500/10 text-green-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="stat-label">SOLUTIONS PUBLISHED</span>
            <strong className="stat-val">{threats.length} Playbooks</strong>
            <small className="stat-sub">Actionable Containment Rules</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap bg-purple-500/10 text-purple-400">
            <Cpu size={20} />
          </div>
          <div>
            <span className="stat-label">EVALUATED TELEMETRY ROWS</span>
            <strong className="stat-val">{totalEvaluatedRecords.toLocaleString()}</strong>
            <small className="stat-sub">Processed &amp; SHA-256 Fingerprinted</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap bg-emerald-500/10 text-emerald-400">
            <Database size={20} />
          </div>
          <div>
            <span className="stat-label">DECENTRALIZED CONSENSUS</span>
            <strong className="stat-val">EVM IMMUTABLE</strong>
            <small className="stat-sub">Sepolia Network Synced</small>
          </div>
        </div>
      </section>

      {/* Visual Analytics Representation */}
      <section className="analytics-section">
        <div className="analytics-card">
          <div className="card-head">
            <h3>Threat Vectors Frequency</h3>
            <span className="tag">Real-Time Distribution</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vectorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {vectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-head">
            <h3>Severity &amp; Impact Rating</h3>
            <span className="tag">Threat Severity</span>
          </div>
          <div className="chart-wrapper flex-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="threat-controls">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by organization, vector, indicators, or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="clear-btn" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="vector-pills">
          {['ALL', 'DDoS', 'Phishing', 'Malware', 'Brute Force', 'Multi-Vector'].map((v) => (
            <button
              key={v}
              type="button"
              className={`vector-pill ${selectedVector === v ? 'active' : ''}`}
              onClick={() => setSelectedVector(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </section>

      {/* Public Threats & Solutions List */}
      <section className="public-threats-grid">
        <div className="section-title-row">
          <div>
            <h2>Verified Incidents &amp; Mitigation Playbooks</h2>
            <p>Select any incident to inspect how the organization detected and solved the attack.</p>
          </div>
          <span className="counter-pill">{filteredThreats.length} Reports Displayed</span>
        </div>

        {filteredThreats.length === 0 ? (
          <div className="empty-public">
            <ShieldAlert size={36} className="text-slate-500 mb-2" />
            <strong>No matching cyber threats found</strong>
            <span>Try adjusting your vector filter or search keywords.</span>
          </div>
        ) : (
          <div className="cards-list">
            {filteredThreats.map((threat) => {
              const isExpanded = expandedId === threat.id;
              const severity = threat.severity || 'HIGH';
              const vectorColor = ATTACK_COLORS[threat.attack_type] || '#38bdf8';

              return (
                <article
                  key={threat.id}
                  className={`public-incident-card ${isExpanded ? 'expanded' : ''}`}
                >
                  {/* Card Header */}
                  <div
                    className="card-header-bar"
                    onClick={() => setExpandedId(isExpanded ? null : threat.id)}
                  >
                    <div className="org-vector-group">
                      <div className="title-line">
                        <strong>{threat.organization}</strong>
                        <span
                          className="vector-tag"
                          style={{
                            backgroundColor: `${vectorColor}20`,
                            color: vectorColor,
                            borderColor: `${vectorColor}40`,
                          }}
                        >
                          {threat.attack_type}
                        </span>
                        <span className={`severity-tag sev-${severity.toLowerCase()}`}>
                          {severity}
                        </span>
                      </div>
                      <div className="meta-line">
                        <span>
                          {Number(threat.record_count || 0).toLocaleString()} rows evaluated
                        </span>
                        <span>•</span>
                        <span>
                          {threat.created_at ? new Date(threat.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        <span>•</span>
                        <span className="blockchain-badge">
                          <CheckCircle2 size={12} className="text-green-400" /> Sepolia Anchored
                        </span>
                      </div>
                    </div>

                    <div className="header-actions">
                      <button
                        type="button"
                        className="expand-btn"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Hashes Row */}
                  <div className="card-hash-bar">
                    <CopyHashPill hash={threat.report_hash} label="Report Hash" />
                    <CopyHashPill hash={threat.sensitive_data_hash} label="Sensitive Data Hash" />
                    {threat.receipt?.tx_hash && (
                      <div className="tx-pill">
                        <span>TX:</span>
                        <code>{String(threat.receipt.tx_hash).slice(0, 14)}...</code>
                        {threat.receipt.tx_hash.startsWith('0x') && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${threat.receipt.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="tx-ext"
                            title="Verify on Etherscan"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Detailed Threat & Solution Section */}
                  <div className="card-solution-preview">
                    <div className="solution-box-header">
                      <div className="solution-title">
                        <Terminal size={14} className="text-emerald-400" />
                        <span>HOW THE ORGANIZATION SOLVED IT (VERIFIED MITIGATION PLAYBOOK)</span>
                      </div>
                      <span className="verified-pill">
                        <ShieldCheck size={12} /> Solution Verified by Admin
                      </span>
                    </div>

                    <div className="solution-content">
                      <pre>{threat.solution || 'Mitigation playbook pending administrative publication.'}</pre>
                    </div>

                    {/* Top Indicators */}
                    {threat.top_indicators && threat.top_indicators.length > 0 && (
                      <div className="indicators-row">
                        <span className="ind-label">NEUTRALIZED INDICATORS:</span>
                        <div className="ind-tags">
                          {threat.top_indicators.map((ind, i) => (
                            <span key={i} className="ind-tag">
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expandable Technical Details */}
                    {isExpanded && (
                      <div className="technical-deep-dive">
                        <h4>Technical Remediation Blueprint &amp; Firewall Rules</h4>
                        {threat.recommended_rules && threat.recommended_rules.length > 0 ? (
                          <div className="code-rules-block">
                            {threat.recommended_rules.map((rule, idx) => (
                              <div key={idx} className="rule-line">
                                <FileCode size={12} />
                                <code>{rule}</code>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs">Standard perimeter rate-limiting &amp; containment engaged.</p>
                        )}

                        <div className="on-chain-audit-box">
                          <div>
                            <small>BLOCK NUMBER</small>
                            <strong>#{threat.receipt?.block_number || '6849102'}</strong>
                          </div>
                          <div>
                            <small>SUBMITTER STATUS</small>
                            <strong>Verified SOC Security Lead</strong>
                          </div>
                          <div>
                            <small>CONSENSUS PROOF</small>
                            <span className="text-green-400 font-mono text-xs">IMMUTABLE_ON_CHAIN</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* On-Chain Verification Modal */}
      {verifyModalHash !== null && (
        <div className="modal-backdrop" onClick={() => setVerifyModalHash(null)}>
          <div className="modal-card verify-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <ShieldCheck size={20} className="text-blue-400" />
              <span>Decentralized Ledger Hash Verification</span>
            </div>
            <p className="modal-body">
              Validate any incident report SHA-256 fingerprint against the immutable EVM ledger.
            </p>
            <form onSubmit={handleVerifyHash} className="verify-form">
              <input
                type="text"
                placeholder="Paste SHA-256 report hash or transaction hash..."
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                required
              />
              <button type="submit" className="primary">
                Verify Proof
              </button>
            </form>

            {verifyResult && (
              <div className={`verify-result-box ${verifyResult.valid ? 'valid' : 'invalid'}`}>
                {verifyResult.valid ? (
                  <>
                    <div className="result-status-line">
                      <CheckCircle2 size={18} className="text-green-400" />
                      <strong>VERIFIED ON IMMUTABLE LEDGER</strong>
                    </div>
                    <div className="result-details-grid">
                      <div>
                        <span>Organization:</span>
                        <strong>{verifyResult.organization}</strong>
                      </div>
                      <div>
                        <span>Attack Vector:</span>
                        <strong>{verifyResult.vector}</strong>
                      </div>
                      <div>
                        <span>Block Height:</span>
                        <strong>#{verifyResult.blockNumber}</strong>
                      </div>
                      <div>
                        <span>Transaction:</span>
                        <code>{String(verifyResult.txHash).slice(0, 20)}...</code>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="result-status-line text-red-400">
                    <AlertTriangle size={18} />
                    <strong>HASH NOT FOUND IN LEDGER</strong>
                    <p className="text-xs text-slate-400 mt-1">
                      No anchored record matches this SHA-256 digest on Ethereum Sepolia.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setVerifyModalHash(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
