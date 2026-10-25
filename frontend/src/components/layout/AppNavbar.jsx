import { useState } from 'react';
import {
  ShieldAlert,
  Coins,
  Wallet,
  AlertCircle,
  CheckCircle2,
  LogOut,
  User,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../ui/domain';
import { Button, Badge, severityTone } from '../ui/primitives';
import { truncateMiddle } from '../ui/overlays';
import { getReputationTier, SEPOLIA_CHAIN_ID, getSepoliaBlockUrl } from '../../threatData';

export function AppNavbar({
  currentUser,
  tokenBalance,
  wallet,
  onOpenAuth,
  onSignOut,
  onToggleSidebar,
  sidebarOpen,
  activePage,
  onNavigate,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const repTier = getReputationTier(tokenBalance);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md md:px-6">
      {/* Left: Mobile hamburger + Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-elevated hover:text-fg lg:hidden"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-left transition-opacity hover:opacity-90"
        >
          <Logo />
        </button>
      </div>

      {/* Middle: Sepolia Network Status Badge */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="flex items-center gap-2 rounded-full border border-ok/25 bg-ok/5 px-3 py-1 text-xs font-medium text-ok">
          <span className="live-dot" />
          <span>Ethereum Sepolia (11155111)</span>
          <span className="text-subtle font-mono">· Synchronized</span>
        </div>
      </div>

      {/* Right: CTIX Token, Wallet Connect, User Profile */}
      <div className="flex items-center gap-2.5">
        {/* CTIX Incentive Token Balance */}
        <div
          className="hidden items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-1.5 text-xs font-medium text-warn sm:flex"
          title="Consortium CTIX Incentive Token Balance"
        >
          <Coins className="size-4 shrink-0 text-warn" />
          <span className="font-mono font-semibold text-fg">{tokenBalance} CTIX</span>
          <span className="text-subtle">·</span>
          <span className="text-[11px]" style={{ color: repTier.badgeColor }}>
            {repTier.tier}
          </span>
        </div>

        {/* EIP-1193 Wallet Status Button */}
        {wallet.status === 'connected' ? (
          <button
            type="button"
            onClick={wallet.disconnect}
            className="hidden items-center gap-2 rounded-lg border border-ok/30 bg-elevated px-3 py-1.5 text-xs font-mono text-fg transition-colors hover:border-line-strong sm:flex"
            title={`Connected: ${wallet.account} (Click to disconnect)`}
          >
            <span className="size-2 rounded-full bg-ok" />
            <span>{truncateMiddle(wallet.account, 6, 4)}</span>
          </button>
        ) : wallet.status === 'wrong-network' ? (
          <button
            type="button"
            onClick={wallet.switchToSepolia}
            className="flex items-center gap-1.5 rounded-lg border border-warn/40 bg-warn/10 px-3 py-1.5 text-xs font-medium text-warn transition-colors hover:bg-warn/20"
          >
            <AlertCircle className="size-3.5" />
            <span>Switch to Sepolia</span>
          </button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon={Wallet}
            loading={wallet.connecting}
            onClick={wallet.connect}
            className="text-xs"
          >
            {wallet.status === 'unavailable' ? 'Install Wallet' : 'Connect Wallet'}
          </Button>
        )}

        {/* Authenticated User / Login Trigger */}
        {currentUser ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-line bg-elevated p-1.5 pr-2.5 text-left text-xs transition-colors hover:border-line-strong"
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-accent/15 font-semibold text-accent uppercase">
                {(currentUser.name || currentUser.email)[0]}
              </span>
              <div className="hidden flex-col text-left xl:flex">
                <span className="max-w-[120px] truncate font-medium text-fg">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-muted capitalize">
                  {currentUser.role === 'admin'
                    ? 'Admin Lead'
                    : currentUser.role === 'public'
                    ? 'Public Analyst'
                    : 'Enterprise SOC'}
                </span>
              </div>
              <ChevronDown className="size-3 text-subtle" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-xl animate-fade-up">
                  <div className="border-b border-line pb-2.5">
                    <p className="truncate text-xs font-semibold text-fg">
                      {currentUser.name || 'Verified Operator'}
                    </p>
                    <p className="truncate text-[11px] font-mono text-muted">
                      {currentUser.email}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge
                        tone={
                          currentUser.role === 'admin'
                            ? 'danger'
                            : currentUser.role === 'public'
                            ? 'accent'
                            : 'ok'
                        }
                      >
                        {currentUser.badge || 'Verified Member'}
                      </Badge>
                      <span className="text-[11px] text-subtle truncate">
                        {currentUser.organization}
                      </span>
                    </div>
                  </div>

                  <div className="py-2 text-xs">
                    <div className="flex items-center justify-between py-1 text-muted">
                      <span>CTIX Balance</span>
                      <span className="font-mono font-semibold text-warn">
                        {tokenBalance} CTIX
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-muted">
                      <span>Reputation</span>
                      <span
                        className="font-medium"
                        style={{ color: repTier.badgeColor }}
                      >
                        {repTier.tier}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-line pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSignOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-danger transition-colors hover:bg-danger/10"
                    >
                      <LogOut className="size-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Button size="sm" variant="gradient" onClick={onOpenAuth}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
