/* ==========================================================================
   Core UI primitives — Button, Card, Badge, StatCard, ProgressBar, Tabs,
   Skeleton, EmptyState, SectionHeader, Field/Input.
   All styling is driven by the Tailwind theme tokens in styles/index.css.
   ========================================================================== */
import { forwardRef, useId } from 'react';
import { Loader2 } from 'lucide-react';

/** Tiny className joiner (drops falsy values). */
export const cn = (...parts) => parts.filter(Boolean).join(' ');

/* --------------------------------------------------------------------------
   Button
   -------------------------------------------------------------------------- */
const BUTTON_VARIANTS = {
  primary:
    'bg-accent text-on-accent font-semibold hover:bg-[#4ddcf1] hover:shadow-glow active:translate-y-px',
  gradient:
    'text-white font-semibold bg-[linear-gradient(135deg,#22d3ee,#8b5cf6)] hover:brightness-110 hover:shadow-glow',
  secondary:
    'bg-elevated text-fg border border-line hover:border-line-strong hover:bg-[#1f1f25]',
  ghost: 'text-muted hover:text-fg hover:bg-white/5',
  danger:
    'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 hover:border-danger/50',
  success: 'bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20',
  white: 'bg-white text-[#09090b] font-semibold hover:bg-zinc-200',
};
const BUTTON_SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-[10px]',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-[10px] justify-center',
};

export const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'secondary', size = 'md', loading = false, icon: Icon, iconRight: IconRight, className, children, disabled, ...props },
  ref,
) {
  const isButton = Comp === 'button';
  return (
    <Comp
      ref={ref}
      type={isButton ? props.type || 'button' : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-out select-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="size-4 shrink-0" aria-hidden /> : null}
    </Comp>
  );
});

/* --------------------------------------------------------------------------
   Card
   -------------------------------------------------------------------------- */
export function Card({ as: Comp = 'div', className, interactive = false, glow = false, children, ...props }) {
  return (
    <Comp
      className={cn(
        'glass rounded-card',
        interactive && 'transition-all duration-200 hover:border-line-strong hover:-translate-y-0.5',
        glow && 'ring-gradient',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, iconTone = 'accent', action, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && <IconTile icon={Icon} tone={iconTone} size="sm" />}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-6">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   IconTile — rounded square holding an icon, tinted by semantic tone
   -------------------------------------------------------------------------- */
const TONES = {
  accent: 'bg-accent/10 text-accent border-accent/20',
  ai: 'bg-ai/10 text-[#a78bfa] border-ai/25',
  ok: 'bg-ok/10 text-ok border-ok/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  warn: 'bg-warn/10 text-warn border-warn/20',
  neutral: 'bg-white/5 text-muted border-line',
};
export function IconTile({ icon: Icon, tone = 'accent', size = 'md', className }) {
  const dims = size === 'sm' ? 'size-8 rounded-lg' : size === 'lg' ? 'size-12 rounded-xl' : 'size-10 rounded-[10px]';
  const icon = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-6' : 'size-5';
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center border', dims, TONES[tone], className)} aria-hidden>
      <Icon className={icon} />
    </span>
  );
}

/* --------------------------------------------------------------------------
   Badge
   -------------------------------------------------------------------------- */
export function Badge({ tone = 'neutral', icon: Icon, dot = false, mono = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-[11.5px] font-medium leading-none',
        mono && 'font-mono',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

/** Severity → tone mapping used everywhere. */
export const severityTone = (sev = 'HIGH') =>
  ({ CRITICAL: 'danger', HIGH: 'danger', MEDIUM: 'warn', LOW: 'ok' })[String(sev).toUpperCase()] || 'neutral';

export function SeverityBadge({ severity = 'HIGH' }) {
  const s = String(severity).toUpperCase();
  return (
    <Badge tone={severityTone(s)} dot className={s === 'CRITICAL' ? 'bg-danger/20' : ''}>
      {s.charAt(0) + s.slice(1).toLowerCase()}
    </Badge>
  );
}

/* --------------------------------------------------------------------------
   StatCard
   -------------------------------------------------------------------------- */
export function StatCard({ label, value, hint, icon, tone = 'accent', trend, loading = false, className }) {
  return (
    <Card className={cn('flex flex-col gap-4 p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
      </div>
      {loading ? (
        <div className="skeleton h-8 w-24" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[28px] font-semibold leading-none tracking-tight">{value}</span>
          {trend && <span className="text-xs font-medium text-ok">{trend}</span>}
        </div>
      )}
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </Card>
  );
}

/* --------------------------------------------------------------------------
   ProgressBar
   -------------------------------------------------------------------------- */
const BAR_TONES = {
  accent: 'bg-accent',
  ai: 'bg-ai',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  gradient: 'bg-[linear-gradient(90deg,#22d3ee,#8b5cf6)]',
};
export function ProgressBar({ value = 0, max = 100, tone = 'accent', label, showValue = false, size = 'md', className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          {label && <span className="text-muted">{label}</span>}
          {showValue && <span className="font-mono font-medium text-fg">{pct.toFixed(1)}%</span>}
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-white/[0.06]', size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5')}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', BAR_TONES[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Tabs (segmented control) — keyboard navigable with arrow keys
   -------------------------------------------------------------------------- */
export function Tabs({ tabs, value, onChange, className, size = 'md', ariaLabel = 'Tabs' }) {
  const onKey = (e, idx) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    e.currentTarget.parentElement?.children[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1', className)}>
      {tabs.map((t, idx) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, idx)}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-elevated text-fg shadow-[inset_0_0_0_1px_#3a3a44]' : 'text-muted hover:text-fg',
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {t.label}
            {t.count != null && (
              <span className={cn('rounded px-1 font-mono text-[10.5px]', active ? 'bg-accent/15 text-accent' : 'bg-white/5 text-subtle')}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Skeleton & EmptyState
   -------------------------------------------------------------------------- */
export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function EmptyState({ icon: Icon, title, description, action, tone = 'neutral', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center', className)}>
      {Icon && <IconTile icon={Icon} tone={tone} size="lg" />}
      <div className="max-w-md">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------------------------------------------------
   SectionHeader — page / section titles
   -------------------------------------------------------------------------- */
export function SectionHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-accent">
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl font-semibold leading-tight md:text-[28px]">{title}</h2>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Form controls
   -------------------------------------------------------------------------- */
export const inputClass =
  'h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-sm text-fg placeholder:text-subtle transition-all duration-150 ' +
  'hover:border-line-strong focus:border-accent/60 focus:outline-none focus:shadow-[0_0_0_3px_rgb(34_211_238/0.15)] aria-[invalid=true]:border-danger/60';

export function Field({ label, hint, error, required, children, className }) {
  const id = useId();
  const child = typeof children === 'function' ? children({ id, invalid: !!error }) : children;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
        </label>
      )}
      {child}
      {error ? (
        <p className="text-xs text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

/** Input with an optional leading icon and trailing slot. */
export const Input = forwardRef(function Input({ icon: Icon, trailing, className, ...props }, ref) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />}
      <input ref={ref} className={cn(inputClass, Icon && 'pl-10', trailing && 'pr-11', className)} {...props} />
      {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  );
});
