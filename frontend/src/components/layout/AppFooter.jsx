import { ShieldCheck, ExternalLink, Code2, Database, Cpu, Lock } from 'lucide-react';
import { Logo } from '../ui/domain';
import { SEPOLIA_CONTRACT_ADDRESS, CTIX_TOKEN_CONTRACT, getSepoliaContractUrl } from '../../threatData';

export function AppFooter({ onOpenDocs }) {
  return (
    <footer className="mt-auto border-t border-line bg-surface/70 px-4 py-8 text-xs text-muted backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Brand & Mission Statement */}
        <div className="flex flex-col gap-2 max-w-sm">
          <Logo compact={false} />
          <p className="text-[12.5px] leading-relaxed text-subtle">
            Decentralized cyber threat intelligence sharing platform backed by Ethereum Sepolia smart contracts, game-theoretic SHAP explainability, and differential privacy federated learning.
          </p>
        </div>

        {/* Status & Contract Addresses */}
        <div className="flex flex-wrap items-center gap-6 font-mono text-[11.5px]">
          <div>
            <span className="text-subtle block uppercase text-[10px] tracking-wider mb-1">Ledger Contract</span>
            <a
              href={getSepoliaContractUrl(SEPOLIA_CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-fg hover:text-accent transition-colors"
            >
              <span>{SEPOLIA_CONTRACT_ADDRESS.slice(0, 10)}...{SEPOLIA_CONTRACT_ADDRESS.slice(-4)}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          <div>
            <span className="text-subtle block uppercase text-[10px] tracking-wider mb-1">CTIX Token</span>
            <a
              href={getSepoliaContractUrl(CTIX_TOKEN_CONTRACT)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-fg hover:text-warn transition-colors"
            >
              <span>{CTIX_TOKEN_CONTRACT.slice(0, 10)}...{CTIX_TOKEN_CONTRACT.slice(-4)}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          <div>
            <span className="text-subtle block uppercase text-[10px] tracking-wider mb-1">Consensus Network</span>
            <span className="text-ok font-semibold">Sepolia 11155111</span>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          {onOpenDocs && (
            <button
              type="button"
              onClick={onOpenDocs}
              className="text-muted hover:text-fg transition-colors"
            >
              Documentation
            </button>
          )}

          <a
            href="https://github.com/sonakshi555/cyber-threat-intelligence-sharing-using-Blockchain"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-muted hover:text-fg transition-colors"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>

          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-muted hover:text-accent transition-colors"
          >
            <span>Etherscan</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-line/40 pt-4 text-[11px] text-subtle sm:flex-row">
        <span>© 2026 CTI / ANCHOR Consortium. All evidence fingerprinted via SHA-256. Zero PII or internal IP disclosure.</span>
        <span>Built with React · Tailwind CSS · EVM Solidity · Web3</span>
      </div>
    </footer>
  );
}
