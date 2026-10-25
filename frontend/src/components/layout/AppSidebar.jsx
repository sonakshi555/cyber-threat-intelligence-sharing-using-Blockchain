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

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-line bg-surface p-4 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Authenticated Role Tag */}
          <div className="rounded-xl border border-line bg-elevated/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-wider uppercase text-subtle">
                Operational Clearance
              </span>
              <span className="live-dot" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {role === 'admin' ? (
                <ShieldAlert className="size-4 text-danger" />
              ) : role === 'public' ? (
                <Globe className="size-4 text-accent" />
              ) : (
                <Building2 className="size-4 text-ok" />
              )}
              <span className="text-xs font-semibold text-fg">
                {role === 'admin'
                  ? 'Consortium Admin'
                  : role === 'public'
                  ? 'Public Researcher'
                  : 'Enterprise SOC Lead'}
              </span>
            </div>
            <p className="mt-1 truncate text-[11px] font-mono text-muted">
              {currentUser?.organization || 'Decentralized CTI Network'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1" aria-label="Main Navigation">
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
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-elevated text-fg shadow-[inset_0_0_0_1px_#3a3a44]'
                      : 'text-muted hover:bg-white/[0.04] hover:text-fg'
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
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px]">{item.label}</div>
                    </div>
                  </div>

                  {item.badge && (
                    <Badge tone={item.badgeTone || 'neutral'} size="xs">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Metadata & Smart Contract Pin */}
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <div className="rounded-lg border border-line/60 bg-bg/50 p-2.5">
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
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
