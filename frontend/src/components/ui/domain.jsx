/* ==========================================================================
   Domain-specific UI — threat-intel, AI and blockchain building blocks
   ========================================================================== */
import { CheckCircle2, Clock3, Globe, Hash, Link2, Server, XCircle, Activity } from 'lucide-react';
import { Badge, cn } from './primitives';

/* --------------------------------------------------------------------------
   Brand mark
   -------------------------------------------------------------------------- */
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#111114" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" stroke="url(#lm-g)" strokeOpacity="0.6" />
      <path d="M16 6.5 8.5 9.8v5.6c0 4.7 3.2 8.9 7.5 10.1 4.3-1.2 7.5-5.4 7.5-10.1V9.8L16 6.5Z" stroke="url(#lm-g)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m16 11.5 3.6 2v4l-3.6 2-3.6-2v-4l3.6-2Z" fill="url(#lm-g)" fillOpacity="0.9" />
    </svg>
  );
}

export function Logo({ compact = false, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[15px] font-semibold tracking-tight">
          CTI <span className="text-subtle">/</span> <span className="text-gradient">ANCHOR</span>
        </span>
      )}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Consensus status — Pending / Verified / Rejected
   -------------------------------------------------------------------------- */
const CONSENSUS = {
  verified: { tone: 'ok', icon: CheckCircle2, label: 'Verified' },
  pending: { tone: 'warn', icon: Clock3, label: 'Pending' },
  rejected: { tone: 'danger', icon: XCircle, label: 'Rejected' },
};
export function ConsensusBadge({ status = 'verified' }) {
  const c = CONSENSUS[status] || CONSENSUS.verified;
  return <Badge tone={c.tone} icon={c.icon}>{c.label}</Badge>;
}

/* --------------------------------------------------------------------------
   IOC type detection + tag (IP, Domain, Hash, URL, Signal)
   -------------------------------------------------------------------------- */
export function detectIocType(value = '') {
  const v = String(value).trim();
  if (/^https?:\/\//i.test(v)) return 'URL';
  if (/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v)) return 'IP';
  if (/^(0x)?[a-f0-9]{32,}$/i.test(v)) return 'Hash';
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v)) return 'Domain';
  return 'Signal';
}
const IOC_STYLE = {
  IP: { icon: Server, cls: 'text-accent border-accent/25 bg-accent/5' },
  Domain: { icon: Globe, cls: 'text-[#a78bfa] border-ai/25 bg-ai/5' },
  Hash: { icon: Hash, cls: 'text-warn border-warn/25 bg-warn/5' },
  URL: { icon: Link2, cls: 'text-danger border-danger/25 bg-danger/5' },
  Signal: { icon: Activity, cls: 'text-muted border-line bg-white/[0.03]' },
};
export function IocTag({ value }) {
  const type = detectIocType(value);
  const s = IOC_STYLE[type];
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex h-6 max-w-full items-center gap-1.5 rounded-md border px-2 text-[11.5px]', s.cls)} title={`${type} indicator`}>
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">{type}:</span>
      <code className="truncate">{value}</code>
    </span>
  );
}

/* --------------------------------------------------------------------------
   Attack vector badge (consistent colour per category)
   -------------------------------------------------------------------------- */
export const ATTACK_COLORS = {
  DDoS: '#22d3ee',
  Phishing: '#f59e0b',
  Malware: '#f43f5e',
  'Brute Force': '#8b5cf6',
  'Multi-Vector': '#10b981',
};
export function AttackBadge({ type }) {
  const color = ATTACK_COLORS[type] || '#a1a1aa';
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-[11.5px] font-medium"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {type}
    </span>
  );
}

/* --------------------------------------------------------------------------
   AI confidence meter — compact bar + percentage
   -------------------------------------------------------------------------- */
export function ConfidenceMeter({ value = 0.95, className }) {
  const pct = Math.round(Number(value) * 1000) / 10;
  const tone = pct >= 95 ? 'bg-ok' : pct >= 85 ? 'bg-accent' : pct >= 70 ? 'bg-warn' : 'bg-danger';
  return (
    <div className={cn('flex min-w-[112px] items-center gap-2', className)} aria-label={`AI confidence ${pct}%`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-mono text-xs text-fg">{pct.toFixed(1)}%</span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Status timeline — vertical steps for on-chain tx lifecycle
   steps: [{ label, description, state: 'done' | 'active' | 'todo' | 'failed', meta }]
   -------------------------------------------------------------------------- */
export function Timeline({ steps }) {
  return (
    <ol className="relative flex flex-col gap-5">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const dot =
          s.state === 'done' ? 'bg-ok border-ok' : s.state === 'active' ? 'bg-accent border-accent animate-pulse' : s.state === 'failed' ? 'bg-danger border-danger' : 'bg-transparent border-line-strong';
        return (
          <li key={s.label} className="relative flex gap-3.5">
            {!last && <span className={cn('absolute left-[7px] top-5 h-[calc(100%+4px)] w-px', s.state === 'done' ? 'bg-ok/40' : 'bg-line')} aria-hidden />}
            <span className={cn('relative mt-1 size-[15px] shrink-0 rounded-full border-2', dot)} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className={cn('text-sm font-medium', s.state === 'todo' ? 'text-subtle' : 'text-fg')}>{s.label}</p>
                {s.meta && <span className="font-mono text-[11.5px] text-subtle">{s.meta}</span>}
              </div>
              {s.description && <p className="mt-0.5 text-[13px] text-muted">{s.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------------------------------------------------
   Key/value row used in detail panels
   -------------------------------------------------------------------------- */
export function KV({ label, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4', className)}>
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-fg sm:text-right">{children}</dd>
    </div>
  );
}
