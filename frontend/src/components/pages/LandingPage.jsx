import { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Sparkles,
  FileText,
  Activity,
  Layers,
  CheckCircle2,
  Share2,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { Button, Card, IconTile, Badge } from '../ui/primitives';
import { LogoMark } from '../ui/domain';
import { SEPOLIA_CONTRACT_ADDRESS, getSepoliaContractUrl } from '../../threatData';

export function LandingPage({ onLaunchApp, onOpenDocs, stats, onNavigate }) {
  const steps = [
    {
      num: '01',
      title: 'Submit Incident Evidence',
      desc: 'SOC teams upload telemetry CSV logs. Sensitive corporate IPs and PII are masked with SHA-256 zero-knowledge hashing.',
      icon: Lock,
      tone: 'accent',
    },
    {
      num: '02',
      title: 'Explainable AI Analysis',
      desc: 'Machine learning models classify vectors with 98.4% accuracy and decompose feature impact via game-theoretic SHAP values.',
      icon: Cpu,
      tone: 'ai',
    },
    {
      num: '03',
      title: 'Validator Consortium Consensus',
      desc: 'Enterprise security nodes review evidence, vote on mitigation strategies, and reach decentralized quorum.',
      icon: ShieldCheck,
      tone: 'warn',
    },
    {
      num: '04',
      title: 'Anchored On-Chain & Rewarded',
      desc: 'Cryptographic report digests are permanently committed to Ethereum Sepolia. Contributors earn +25 CTIX tokens.',
      icon: Database,
      tone: 'ok',
    },
  ];

  return (
    <div className="flex flex-col gap-16 py-6 md:py-12">
      {/* 1. Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-4">
        {/* Glow backdrop */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-full max-w-4xl -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, #22d3ee 0%, #8b5cf6 60%, transparent 100%)',
          }}
          aria-hidden
        />

        {/* Live status badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent">
          <span className="live-dot" />
          <span>Ethereum Sepolia Network Active</span>
          <span className="text-subtle font-mono">· FedAvg Round #14</span>
        </div>

        {/* Bold headline with gradient */}
        <h1 className="max-w-4xl font-display text-4xl font-bold tracking-tight text-fg sm:text-5xl md:text-6xl md:leading-[1.12]">
          Collective defense,{' '}
          <span className="text-gradient">verified on-chain.</span>
        </h1>

        {/* One-line subtitle */}
        <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
          Decentralized cyber threat intelligence sharing powered by EVM smart contracts, explainable AI classification, and zero-knowledge privacy shields.
        </p>

        {/* Two CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Button
            size="lg"
            variant="gradient"
            onClick={onLaunchApp}
            iconRight={ArrowRight}
          >
            Launch Command Center
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={onOpenDocs}
            icon={FileText}
          >
            Architecture Documentation
          </Button>
        </div>

        {/* Live Stats Strip */}
        <div className="mt-14 w-full max-w-5xl rounded-2xl border border-line bg-surface/80 p-5 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-2 gap-4 divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Threats Shared
              </span>
              <strong className="mt-1 font-display text-2xl font-bold text-fg sm:text-3xl">
                {stats.threatsCount}
              </strong>
              <small className="text-[11px] text-ok">100% Cryptographic Proof</small>
            </div>

            <div className="flex flex-col items-center justify-center p-2 text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Consortium Nodes
              </span>
              <strong className="mt-1 font-display text-2xl font-bold text-fg sm:text-3xl">
                5 Active
              </strong>
              <small className="text-[11px] text-accent">Differential Privacy &epsilon;=0.5</small>
            </div>

            <div className="flex flex-col items-center justify-center p-2 text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Blocks Anchored
              </span>
              <strong className="mt-1 font-display text-2xl font-bold text-fg sm:text-3xl font-mono">
                #{stats.latestBlock || 6849240}
              </strong>
              <small className="text-[11px] text-muted">Sepolia Testnet EVM</small>
            </div>

            <div className="flex flex-col items-center justify-center p-2 text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Consensus Accuracy
              </span>
              <strong className="mt-1 font-display text-2xl font-bold text-ok sm:text-3xl">
                98.4%
              </strong>
              <small className="text-[11px] text-ok">AUC = 0.992 Verification</small>
            </div>
          </div>
        </div>

        {/* Animated Connected Network SVG Visual */}
        <div className="relative mt-12 w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface/50 p-6 backdrop-blur">
          <div className="mb-4 flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-2">
              <Activity className="size-4 text-accent" />
              <span>Decentralized Node Topology &amp; P2P Gradient Sync</span>
            </span>
            <span className="font-mono text-accent">Lyapunov Stable</span>
          </div>

          <svg viewBox="0 0 800 240" className="w-full text-line stroke-current">
            <defs>
              <linearGradient id="conn-g" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="0.5" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="1" stopColor="#10b981" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Connecting lines */}
            <path d="M120 120 L280 60 L480 80 L680 120" stroke="url(#conn-g)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
            <path d="M120 120 L300 170 L500 160 L680 120" stroke="url(#conn-g)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
            <path d="M280 60 L300 170 M480 80 L500 160" stroke="#27272f" strokeWidth="1" strokeDasharray="2 2" fill="none" />

            {/* Nodes */}
            <g transform="translate(120, 120)">
              <circle r="24" fill="#18181d" stroke="#22d3ee" strokeWidth="2" />
              <circle r="32" fill="none" stroke="#22d3ee" strokeWidth="0.8" opacity="0.3" className="animate-ping" />
              <text y="4" textAnchor="middle" fill="#22d3ee" fontSize="10" fontFamily="monospace">SOC-01</text>
              <text y="42" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="sans-serif">Northstar Security</text>
            </g>

            <g transform="translate(280, 60)">
              <circle r="20" fill="#18181d" stroke="#8b5cf6" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="#a78bfa" fontSize="10" fontFamily="monospace">NODE-02</text>
              <text y="36" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="sans-serif">CloudScale Telecom</text>
            </g>

            <g transform="translate(300, 170)">
              <circle r="20" fill="#18181d" stroke="#f59e0b" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace">NODE-03</text>
              <text y="36" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="sans-serif">Apex Financial</text>
            </g>

            <g transform="translate(480, 80)">
              <circle r="22" fill="#18181d" stroke="#10b981" strokeWidth="2" />
              <circle r="28" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.4" />
              <text y="4" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace">EVM-LEDGER</text>
              <text y="38" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="sans-serif">Smart Contract</text>
            </g>

            <g transform="translate(500, 160)">
              <circle r="20" fill="#18181d" stroke="#8b5cf6" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="#a78bfa" fontSize="10" fontFamily="monospace">NODE-04</text>
              <text y="36" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="sans-serif">Quantum Defense</text>
            </g>

            <g transform="translate(680, 120)">
              <circle r="24" fill="#18181d" stroke="#22d3ee" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="#22d3ee" fontSize="10" fontFamily="monospace">PUBLIC</text>
              <text y="42" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="sans-serif">Decentralized Feed</text>
            </g>
          </svg>
        </div>
      </section>

      {/* 2. How it works: 4-Step Horizontal Flow */}
      <section className="px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Consortium Workflow
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg">
              How the platform protects collective infrastructure
            </h2>
            <p className="mt-2 text-muted text-sm max-w-xl mx-auto">
              From local anomalous traffic detection to immutable Ethereum blockchain commitment in four seamless, privacy-preserving steps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 relative">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              return (
                <Card key={st.num} className="relative flex flex-col p-6 interactive">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-semibold text-accent">
                      {st.num}
                    </span>
                    <IconTile icon={Icon} tone={st.tone} size="md" />
                  </div>
                  <h3 className="text-base font-semibold text-fg">{st.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{st.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
