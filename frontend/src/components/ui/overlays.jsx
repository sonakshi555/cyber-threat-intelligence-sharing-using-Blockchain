/* ==========================================================================
   Overlay & feedback primitives — Modal, Toast system, HashDisplay, DataTable
   ========================================================================== */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, CheckCircle2, Copy, ExternalLink, Info, X, XCircle } from 'lucide-react';
import { cn } from './primitives';

/* --------------------------------------------------------------------------
   Modal — accessible dialog: focus trap, Esc to close, scroll lock
   -------------------------------------------------------------------------- */
export function Modal({ open, onClose, title, description, icon, children, footer, size = 'md' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    // focus first focusable element inside the dialog
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      (first || panelRef.current)?.focus();
    });
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-md' : 'max-w-xl';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6" role="presentation">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fade-up_200ms_ease-out_both]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl animate-fade-up',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            {icon}
            <div className="min-w-0">
              <h2 id="modal-title" className="text-lg font-semibold leading-6">{title}</h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-1 rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-bg/40 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* --------------------------------------------------------------------------
   Toast system — <ToastProvider> + useToast()
   toast({ tone: 'success' | 'error' | 'info' | 'warning', title, description, action })
   -------------------------------------------------------------------------- */
const ToastContext = createContext({ toast: () => {} });
const TOAST_ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const TOAST_TONES = { success: 'text-ok', error: 'text-danger', info: 'text-accent', warning: 'text-warn' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    ({ tone = 'info', title, description, action, duration = 5000 }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, tone, title, description, action }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.tone];
          return (
            <div key={t.id} role="status" className="glass pointer-events-auto flex items-start gap-3 rounded-xl p-4 animate-fade-up">
              <Icon className={cn('mt-0.5 size-5 shrink-0', TOAST_TONES[t.tone])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 break-words text-[13px] text-muted">{t.description}</p>}
                {t.action && <div className="mt-2">{t.action}</div>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="rounded p-1 text-subtle hover:text-fg">
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* --------------------------------------------------------------------------
   CopyButton & HashDisplay — truncate-and-copy pattern for hashes/addresses
   -------------------------------------------------------------------------- */
export function CopyButton({ value, label = 'value', className }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(value ?? ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? 'Copied' : `Copy ${label}`}
      className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-white/5 hover:text-fg', className)}
    >
      {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
    </button>
  );
}

/** Middle-truncate a long hex string: 0x51c7…01fa */
export const truncateMiddle = (str = '', head = 8, tail = 6) => {
  const s = String(str || '');
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
};

export function HashDisplay({ value, label, href, head = 8, tail = 6, full = false, tone = 'default', className }) {
  if (!value) return <span className="text-subtle">—</span>;
  const color = tone === 'accent' ? 'text-accent' : tone === 'ok' ? 'text-ok' : tone === 'ai' ? 'text-[#a78bfa]' : 'text-fg/90';
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-lg border border-line bg-bg/60 py-0.5 pl-2.5 pr-0.5', className)}>
      <code className={cn('min-w-0 text-[12.5px]', full ? 'break-all' : 'truncate', color)} title={String(value)}>
        {full ? value : truncateMiddle(value, head, tail)}
      </code>
      <CopyButton value={value} label={label || 'hash'} />
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open ${label || 'hash'} in block explorer`}
          title="Open in Etherscan"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-white/5 hover:text-accent"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </span>
  );
}

/* --------------------------------------------------------------------------
   DataTable — responsive table with sticky header, row click & empty state
   columns: [{ key, header, render?, className?, hideBelow?: 'md'|'lg' }]
   -------------------------------------------------------------------------- */
const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' };

export function DataTable({ columns, rows, rowKey = 'id', onRowClick, empty, loading = false, caption, className }) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-line bg-surface/70', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-10 bg-elevated/95 backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-subtle', c.hideBelow && HIDE[c.hideBelow], c.headClassName)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-line">
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-4', c.hideBelow && HIDE[c.hideBelow])}>
                        <div className="skeleton h-4 w-full max-w-[140px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={row[rowKey]}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(row)) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn('border-t border-line transition-colors', onRowClick && 'cursor-pointer hover:bg-white/[0.025] focus-visible:bg-white/[0.04]')}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-3.5 align-middle', c.hideBelow && HIDE[c.hideBelow], c.className)}>
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && empty}
    </div>
  );
}
