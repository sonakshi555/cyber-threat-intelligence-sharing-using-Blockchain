import { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  FileUp,
  ClipboardCheck,
  Database,
  LineChart,
  Globe,
  Coins,
  Cpu,
  LogOut,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  Pin,
  PinOff,
} from 'lucide-react';
import { Badge } from '../ui/primitives';
import { SEPOLIA_CONTRACT_ADDRESS, getSepoliaContractUrl } from '../../threatData';

export function AppSidebar({
  activePage,
  onNavigate,
  currentUser,
  onSignOut,
  pendingCount = 0,
  isOpen = false,
  onClose,
}) {
  const role = currentUser?.role || 'uploader';
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Expanded if pinned, hovered, or mobile drawer open
  const isExpanded = isPinned || isHovered || isOpen;

  const NAV_ITEMS = [
    {
      id: 'landing',
      label: 'Home / Hero',
      icon: Globe,
      description: 'Collective defense intro',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'KPIs, charts & summary',
    },
    {
      id: 'feed',
      label: 'Threat Feed',
      icon: ShieldAlert,
      description: 'Live verified IOC telemetry',
    },
    {
      id: 'submit',
      label: 'Submit Threat',
      icon: FileUp,
      description: 'Multi-step dataset analysis',
      hidden: role === 'public',
    },
    {
      id: 'consensus',
      label: 'Consensus & Voting',
      icon: ClipboardCheck,
      description: 'Validator queue & quorum',
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      badgeTone: 'warn',
    },
    {
      id: 'explorer',
      label: 'Block Explorer',
      icon: Database,
      description: 'EVM hashes & receipts',
    },
    {
      id: 'insights',
      label: 'AI/ML Insights',
      icon: LineChart,
      description: 'SHAP, ROC & FedAvg',
      badge: 'AUC 0.992',
      badgeTone: 'ai',
    },
  ].filter((item) => !item.hidden);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Desktop Spacer to prevent layout shift when hovering */}
      <div className="hidden lg:block w-16 shrink-0 transition-all duration-200" />

      {/* Sidebar Container: Movable/Expandable on cursor hover, stays closed otherwise */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col justify-between border-r border-line bg-surface/95 backdrop-blur-md transition-all duration-300 ease-in-out shadow-2xl ${
          // Width based on hover / pinned state
          isExpanded ? 'w-64 p-4' : 'w-16 p-2.5'
        } ${
          // Mobile visibility
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Sidebar Navigation"
      >
        <div className="flex flex-col gap-5 overflow-hidden">
          {/* Header row with Pin button */}
          <div className="flex items-center justify-between pb-1">
            {isExpanded ? (
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-accent font-mono">
                  Navigation
                </span>
              </div>
            ) : (
              <div className="mx-auto my-1">
                <span className="live-dot" title="Sepolia Live" />
              </div>
            )}

            {isExpanded && (
              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={`p-1 rounded-md text-subtle hover:text-fg transition-colors ${
                  isPinned ? 'text-accent bg-accent/15' : ''
                }`}
                title={isPinned ? 'Unpin sidebar (auto-collapse on cursor leave)' : 'Pin sidebar open'}
                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {isPinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
              </button>
            )}
          </div>

          {/* Authenticated Clearance Role Card (Full in expanded, Mini dot in collapsed) */}
          {isExpanded ? (
            <div className="rounded-xl border border-line bg-elevated/80 p-3 animate-fade-up">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-wider uppercase text-subtle">
                  Operational Clearance
                </span>
                <span className="text-[10px] font-mono text-ok">Active</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {role === 'admin' ? (
                  <ShieldAlert className="size-4 text-danger shrink-0" />
                ) : role === 'public' ? (
                  <Globe className="size-4 text-accent shrink-0" />
                ) : (
                  <Building2 className="size-4 text-ok shrink-0" />
                )}
                <span className="text-xs font-semibold text-fg truncate">
                  {role === 'admin'
                    ? 'Consortium Admin'
                    : role === 'public'
                    ? 'Public Researcher'
                    : 'Enterprise SOC Lead'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-mono text-muted">
                {currentUser?.organization || 'Decentralized CTI Network'}
              </p>
            </div>
          ) : (
            <div
              className="mx-auto flex size-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent cursor-pointer"
              title={`Role: ${currentUser?.role || 'User'} (${currentUser?.organization || 'CTI'})`}
            >
              {role === 'admin' ? (
                <ShieldAlert className="size-4 text-danger" />
              ) : role === 'public' ? (
                <Globe className="size-4 text-accent" />
              ) : (
                <Building2 className="size-4 text-ok" />
              )}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onClose?.();
                  }}
                  title={!isExpanded ? item.label : undefined}
                  className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                    isExpanded
                      ? 'w-full justify-between px-3 py-2.5 text-left text-sm font-medium'
                      : 'size-11 justify-center mx-auto'
                  } ${
                    active
                      ? 'bg-elevated text-fg border border-line-strong shadow-[inset_0_0_0_1px_#3a3a44]'
                      : 'text-muted hover:bg-white/[0.05] hover:text-fg border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`size-4 shrink-0 transition-colors ${
                        active
                          ? 'text-accent'
                          : 'text-subtle group-hover:text-muted'
                      }`}
                    />
                    {isExpanded && (
                      <div className="min-w-0 truncate">
                        <div className="truncate text-[13px]">{item.label}</div>
                      </div>
                    )}
                  </div>

                  {isExpanded && item.badge && (
                    <Badge tone={item.badgeTone || 'neutral'} size="xs">
                      {item.badge}
                    </Badge>
                  )}

                  {/* Indicator pip when collapsed and active */}
                  {!isExpanded && active && (
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Metadata & Smart Contract Pin */}
        <div className="flex flex-col gap-2.5 border-t border-line pt-3 overflow-hidden">
          {isExpanded ? (
            <>
              <div className="rounded-lg border border-line/60 bg-bg/60 p-2.5">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>EVM Consensus</span>
                  <span className="font-mono text-accent">Sepolia</span>
                </div>
                <a
                  href={getSepoliaContractUrl(SEPOLIA_CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 flex items-center justify-between font-mono text-[11px] text-subtle transition-colors hover:text-fg"
                  title="View ThreatReportLedger.sol on Etherscan"
                >
                  <span className="truncate">0x5FbD...8aa3</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </>
          ) : (
            currentUser && (
              <button
                type="button"
                onClick={onSignOut}
                className="mx-auto flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                title="Sign Out"
              >
                <LogOut className="size-4" />
              </button>
            )
          )}
        </div>
      </aside>
    </>
  );
}
