import { useState, useMemo } from 'react';
import {
  Cpu,
  Sparkles,
  SlidersHorizontal,
  Network,
  Lock,
  Layers,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { Card, CardHeader, StatCard, ProgressBar, Button, SectionHeader } from '../ui/primitives';
import { CopyButton } from '../ui/overlays';
import {
  getShapExplanation,
  computeMetricsAtThreshold,
  INITIAL_FEDERATED_NODES,
  INITIAL_GLOBAL_MODEL,
  runFederatedRound,
} from '../../threatData';

export function AiInsightsPage({ threats = [], selectedThreat }) {
  const [subTab, setSubTab] = useState('shap'); // 'shap' | 'roc' | 'federated'

  // SHAP widget state
  const activeThreat = selectedThreat || threats[0] || {
    organization: 'Apex Financial Group',
    attack_type: 'Phishing',
    top_indicators: ['lure_url', 'credential_post', 'sender_spoof'],
  };
  const shap = useMemo(
    () => getShapExplanation(activeThreat.attack_type, activeThreat.top_indicators),
    [activeThreat]
  );

  // ROC & Confusion Matrix state
  const [threshold, setThreshold] = useState(0.5);
  const rocMetrics = useMemo(() => computeMetricsAtThreshold(threshold), [threshold]);

  // Federated learning state
  const [nodes, setNodes] = useState(INITIAL_FEDERATED_NODES);
  const [globalModel, setGlobalModel] = useState(INITIAL_GLOBAL_MODEL);
  const [aggregating, setAggregating] = useState(false);
  const [fedToast, setFedToast] = useState(null);

  function handleTriggerFedAvg() {
    setAggregating(true);
    setTimeout(() => {
      const res = runFederatedRound(globalModel.round, nodes, globalModel);
      setNodes(res.nodes);
      setGlobalModel(res.globalModel);
      setAggregating(false);
      setFedToast(
        `Round #${res.globalModel.round} FedAvg completed. Global model accuracy converged to ${(
          res.globalModel.globalAccuracy * 100
        ).toFixed(2)}%. Zero raw logs shared.`
      );
      setTimeout(() => setFedToast(null), 4000);
    }, 450);
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <SectionHeader
        eyebrow="Explainable AI &amp; Privacy-Preserving ML"
        title="AI/ML Intelligence, SHAP Attribution &amp; Federated Learning"
        description="Transparent machine learning decisions. Inspect game-theoretic Shapley feature attributions, test ROC decision boundaries, and simulate privacy-preserving FedAvg consortium training."
      />

      {/* Model Performance Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="ENSEMBLE ACCURACY"
          value="98.4%"
          trend="+0.3%"
          hint="Random Forest &amp; Neural Ensemble"
          icon={Cpu}
          tone="ok"
        />
        <StatCard
          label="AREA UNDER ROC (AUC)"
          value="0.992"
          trend="Optimal"
          hint="UNSW-NB15 &amp; CIC-IDS benchmark"
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="SHAP EXPLAINABILITY"
          value="100% Attributed"
          trend="Game Theory"
          hint="Additive feature importance φᵢ"
          icon={Sparkles}
          tone="ai"
        />
        <StatCard
          label="DIFFERENTIAL PRIVACY"
          value="ε = 0.5"
          trend="Strict Shield"
          hint="Zero raw packet logs shared"
          icon={Lock}
          tone="warn"
        />
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setSubTab('shap')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            subTab === 'shap'
              ? 'bg-elevated text-fg border border-line-strong shadow-sm'
              : 'text-muted hover:text-fg'
          }`}
        >
          <Sparkles className="size-3.5 text-accent" />
          <span>SHAP Feature Attribution</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('roc')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            subTab === 'roc'
              ? 'bg-elevated text-fg border border-line-strong shadow-sm'
              : 'text-muted hover:text-fg'
          }`}
        >
          <SlidersHorizontal className="size-3.5 text-ai" />
          <span>ROC &amp; Confusion Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('federated')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            subTab === 'federated'
              ? 'bg-elevated text-fg border border-line-strong shadow-sm'
              : 'text-muted hover:text-fg'
          }`}
        >
          <Network className="size-3.5 text-ok" />
          <span>Federated Learning (FedAvg)</span>
        </button>
      </div>

      {/* 1. SHAP Waterfall View */}
      {subTab === 'shap' && (
        <Card className="p-6 flex flex-col gap-6 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <h3 className="text-base font-semibold text-fg">
                  Local Additive Feature Attribution (SHAP Decomposition)
                </h3>
              </div>
              <p className="text-xs text-muted mt-1">
                Active Inspection: <strong>{activeThreat.organization}</strong> ({activeThreat.attack_type})
              </p>
            </div>

            <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
              Game-Theoretic Shapley Values (&phi;<sub>i</sub>)
            </div>
          </div>

          {/* Mathematical Equation */}
          <div className="rounded-xl border border-line bg-bg p-3.5 font-mono text-xs text-accent">
            {shap.equation}
          </div>

          {/* Feature List */}
          <div className="flex flex-col gap-3">
            {shap.features.map((feat, idx) => {
              const isPos = feat.phi > 0;
              const pct = Math.min(100, Math.round(Math.abs(feat.phi) * 220));
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-fg">{feat.name}</span>
                    <span className="font-mono text-xs text-accent font-medium">{feat.value}</span>
                  </div>

                  <div className="relative flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPos ? 'bg-danger' : 'bg-ok'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isPos ? 'text-danger' : 'text-ok'
                      }`}
                    >
                      {isPos ? `+${feat.phi.toFixed(2)}` : feat.phi.toFixed(2)}
                    </span>
                  </div>

                  <span className="text-xs text-muted leading-relaxed">{feat.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-line bg-surface p-4 text-center font-mono">
            <div>
              <span className="text-xs text-muted uppercase block">Baseline E[f(x)]</span>
              <strong className="text-base text-fg font-bold">{shap.baseValue.toFixed(3)}</strong>
            </div>
            <div>
              <span className="text-xs text-muted uppercase block">Net Shapley Shift</span>
              <strong className="text-base text-accent font-bold">
                +{(shap.outputValue - shap.baseValue).toFixed(3)}
              </strong>
            </div>
            <div>
              <span className="text-xs text-muted uppercase block">Malicious Confidence f(x)</span>
              <strong className="text-base text-ok font-bold">
                {(shap.outputValue * 100).toFixed(1)}% Malicious
              </strong>
            </div>
          </div>
        </Card>
      )}

      {/* 2. ROC & Confusion Matrix View */}
      {subTab === 'roc' && (
        <div className="flex flex-col gap-6 animate-fade-up">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
              <div>
                <h3 className="text-base font-semibold text-fg">
                  Decision Boundary &amp; ROC Curve Performance
                </h3>
                <p className="text-xs text-muted mt-1">
                  Adjust decision threshold (&tau;) to observe real-time trade-off between TPR and FPR.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted font-medium">
                  Threshold (&tau;): <strong className="text-accent font-mono">{threshold.toFixed(2)}</strong>
                </span>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Confusion Matrix Grid */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-fg">
                    Confusion Matrix (N = {rocMetrics.total.toLocaleString()})
                  </span>
                  <span className="font-mono text-accent">AUC = 0.992</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                  {/* TP */}
                  <div className="rounded-xl border border-ok/30 bg-ok/10 p-4">
                    <span className="text-[10px] uppercase text-subtle block">True Positive (TP)</span>
                    <strong className="text-xl text-ok block mt-1">
                      {rocMetrics.tp.toLocaleString()}
                    </strong>
                    <small className="text-[10px] text-muted">Threat Caught</small>
                  </div>

                  {/* FN */}
                  <div className="rounded-xl border border-danger/30 bg-danger/10 p-4">
                    <span className="text-[10px] uppercase text-subtle block">False Negative (FN)</span>
                    <strong className="text-xl text-danger block mt-1">
                      {rocMetrics.fn.toLocaleString()}
                    </strong>
                    <small className="text-[10px] text-muted">Missed Attack</small>
                  </div>

                  {/* FP */}
                  <div className="rounded-xl border border-warn/30 bg-warn/10 p-4">
                    <span className="text-[10px] uppercase text-subtle block">False Positive (FP)</span>
                    <strong className="text-xl text-warn block mt-1">
                      {rocMetrics.fp.toLocaleString()}
                    </strong>
                    <small className="text-[10px] text-muted">False Alarm</small>
                  </div>

                  {/* TN */}
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
                    <span className="text-[10px] uppercase text-subtle block">True Negative (TN)</span>
                    <strong className="text-xl text-accent block mt-1">
                      {rocMetrics.tn.toLocaleString()}
                    </strong>
                    <small className="text-[10px] text-muted">Benign Passed</small>
                  </div>
                </div>

                {/* Metric Strip */}
                <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-2">
                  <div className="rounded-lg border border-line bg-surface p-2">
                    <span className="text-[10px] text-subtle block">Accuracy</span>
                    <strong className="text-ok">{(rocMetrics.accuracy * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-2">
                    <span className="text-[10px] text-subtle block">Precision</span>
                    <strong className="text-accent">{(rocMetrics.precision * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-2">
                    <span className="text-[10px] text-subtle block">Recall</span>
                    <strong className="text-ai">{(rocMetrics.recall * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-2">
                    <span className="text-[10px] text-subtle block">F1 Score</span>
                    <strong className="text-warn">{(rocMetrics.f1Score * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* ROC SVG Graphic */}
              <div className="flex flex-col gap-2 rounded-xl border border-line bg-bg p-4">
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span>Receiver Operating Characteristic (ROC)</span>
                  <span className="font-mono text-ok">AUC = 0.992</span>
                </div>

                <div className="relative aspect-[4/3] w-full">
                  <svg viewBox="0 0 280 200" className="size-full">
                    <defs>
                      <linearGradient id="roc-g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <rect x="35" y="15" width="230" height="155" fill="#111114" rx="6" />
                    <line x1="35" y1="92" x2="265" y2="92" stroke="#27272f" strokeDasharray="3 3" />
                    <line x1="150" y1="15" x2="150" y2="170" stroke="#27272f" strokeDasharray="3 3" />
                    <line x1="35" y1="170" x2="265" y2="15" stroke="#3f3f46" strokeDasharray="4 4" strokeWidth="1" />

                    {/* Area under curve */}
                    <polygon
                      points="35,170 35,42 42,28 70,20 150,17 265,15 265,170"
                      fill="url(#roc-g)"
                    />

                    {/* Curve line */}
                    <polyline
                      points="35,170 36,44 45,28 80,21 160,17 265,15"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Operating point */}
                    {(() => {
                      const markerX = 35 + (1 - rocMetrics.specificity) * 230;
                      const markerY = 170 - rocMetrics.recall * 155;
                      return (
                        <g>
                          <circle cx={markerX} cy={markerY} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                          <text x={Math.min(220, markerX + 8)} y={markerY - 4} fill="#10b981" fontSize="10" fontFamily="monospace">
                            &tau;={threshold.toFixed(2)}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Labels */}
                    <text x="18" y="20" fill="#8b8b94" fontSize="9" textAnchor="middle">1.0</text>
                    <text x="18" y="95" fill="#8b8b94" fontSize="9" textAnchor="middle">0.5</text>
                    <text x="18" y="170" fill="#8b8b94" fontSize="9" textAnchor="middle">0.0</text>
                    <text x="35" y="186" fill="#8b8b94" fontSize="9" textAnchor="middle">0.0</text>
                    <text x="150" y="186" fill="#8b8b94" fontSize="9" textAnchor="middle">0.5</text>
                    <text x="265" y="186" fill="#8b8b94" fontSize="9" textAnchor="middle">1.0</text>
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 3. Federated Learning Simulator View */}
      {subTab === 'federated' && (
        <div className="flex flex-col gap-6 animate-fade-up">
          {fedToast && (
            <div className="flex items-center gap-2 rounded-xl border border-ok/30 bg-ok/10 p-3.5 text-xs text-ok">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{fedToast}</span>
            </div>
          )}

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Network className="size-4 text-ok" />
                  <h3 className="text-base font-semibold text-fg">
                    FedAvg Distributed Intelligence Consortium Engine
                  </h3>
                </div>
                <p className="text-xs text-muted mt-1">
                  Model gradients are averaged across 5 sovereign enterprise nodes without centralizing raw telemetry.
                </p>
              </div>

              <Button
                variant="gradient"
                size="md"
                loading={aggregating}
                onClick={handleTriggerFedAvg}
                icon={RefreshCw}
              >
                {aggregating ? 'Aggregating Gradients...' : 'Trigger FedAvg Round'}
              </Button>
            </div>

            {/* Differential Privacy Guarantee Box */}
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/25 bg-accent/5 p-4 text-xs text-muted">
              <Lock className="size-4 text-accent shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-fg">Differential Privacy Guarantee (&epsilon; = 0.5):</strong> Raw corporate logs, internal network subnets, and hostnames never leave local infrastructure. Only parameter weight updates (&Delta;W<sub>k</sub>) are exchanged.
              </p>
            </div>

            {/* Global Model Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="rounded-xl border border-line bg-surface p-3.5">
                <span className="text-[10px] text-subtle uppercase block">Epoch Round</span>
                <strong className="text-xl text-fg mt-1 block">#{globalModel.round}</strong>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3.5">
                <span className="text-[10px] text-subtle uppercase block">Global Accuracy</span>
                <strong className="text-xl text-ok mt-1 block">
                  {(globalModel.globalAccuracy * 100).toFixed(2)}%
                </strong>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3.5">
                <span className="text-[10px] text-subtle uppercase block">Federated Loss</span>
                <strong className="text-xl text-accent mt-1 block">
                  {globalModel.globalLoss.toFixed(4)}
                </strong>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3.5">
                <span className="text-[10px] text-subtle uppercase block">Convergence State</span>
                <strong className="text-sm text-warn mt-1 block">
                  {globalModel.convergenceState}
                </strong>
              </div>
            </div>

            {/* Consortium Nodes Grid */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold text-fg">
                  Participating Consortium Nodes ({nodes.length})
                </span>
                <span className="font-mono text-subtle">
                  Total Samples: {nodes.reduce((s, n) => s + n.localSamples, 0).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nodes.map((n) => (
                  <div
                    key={n.id}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-fg">{n.name}</h4>
                        <span className="text-[11px] text-subtle">{n.sector}</span>
                      </div>
                      <span className="rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 text-[10px] font-mono text-ok">
                        {n.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-subtle block">Samples</span>
                        <strong className="text-fg">{n.localSamples.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-subtle block">Accuracy</span>
                        <strong className="text-ok">{(n.localAccuracy * 100).toFixed(1)}%</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-subtle block">Weight (wₖ)</span>
                        <strong className="text-accent">{(n.weightShare * 100).toFixed(1)}%</strong>
                      </div>
                    </div>

                    <ProgressBar value={n.weightShare * 100} max={100} tone="gradient" size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient Digest on Sepolia */}
            <div className="mt-6 rounded-xl border border-line bg-bg p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-fg">Anchored Gradient Digest (EVM Sepolia)</span>
                <span className="font-mono text-accent">State Commit</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-accent">
                <code className="truncate">{globalModel.gradientHash}</code>
                <CopyButton value={globalModel.gradientHash} label="Gradient Hash" />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
