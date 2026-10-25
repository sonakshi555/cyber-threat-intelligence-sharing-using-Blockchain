import { FileText, Cpu, Database, ShieldCheck, Lock, ExternalLink, Coins } from 'lucide-react';
import { Modal } from '../ui/overlays';
import { Button } from '../ui/primitives';
import { SEPOLIA_CONTRACT_ADDRESS, CTIX_TOKEN_CONTRACT, getSepoliaContractUrl } from '../../threatData';

export function DocumentationModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="CTI / ANCHOR Architectural Documentation"
      description="Decentralized Threat Intelligence Sharing with EVM Smart Contracts &amp; Explainable AI."
      icon={<FileText className="size-6 text-accent" />}
      footer={
        <Button variant="secondary" size="md" onClick={onClose}>
          Close Documentation
        </Button>
      }
    >
      <div className="flex flex-col gap-6 text-xs text-muted leading-relaxed">
        {/* Abstract */}
        <div className="rounded-xl border border-line bg-surface p-4">
          <h4 className="text-sm font-semibold text-fg mb-1">Platform Architecture</h4>
          <p>
            CTI / ANCHOR bridges the gap between private enterprise cybersecurity telemetry and collective defense. Using <strong>Ethereum Sepolia EVM smart contracts</strong>, consortium nodes validate and anchor cyber threat intelligence in an immutable, tamper-evident ledger while keeping sensitive organization topology permanently encrypted in <strong>SHA-256 hashed form</strong>.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-line bg-bg p-3.5">
            <div className="flex items-center gap-2 text-ok font-semibold mb-1">
              <ShieldCheck className="size-4" />
              <span>1. Zero-Leakage Privacy</span>
            </div>
            <p className="text-[11.5px] text-subtle">
              Internal IPs, hostnames, and PII are masked into Merkle leaves. Only actionable attack indicators and verified solutions are transparently shared.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-bg p-3.5">
            <div className="flex items-center gap-2 text-accent font-semibold mb-1">
              <Database className="size-4" />
              <span>2. EVM Sepolia Ledger</span>
            </div>
            <p className="text-[11.5px] text-subtle">
              Reports are committed to <code>ThreatReportLedger.sol</code> after 80% validator supermajority quorum. Zero risk of retroactive falsification.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-bg p-3.5">
            <div className="flex items-center gap-2 text-ai font-semibold mb-1">
              <Cpu className="size-4" />
              <span>3. Explainable AI &amp; FedAvg</span>
            </div>
            <p className="text-[11.5px] text-subtle">
              Classification confidence (98.4%) is explained via game-theoretic SHAP attributions (&phi;<sub>i</sub>). Models train via differential privacy FedAvg.
            </p>
          </div>
        </div>

        {/* CTIX Tokenomics */}
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-warn font-semibold mb-1">
            <Coins className="size-4" />
            <span>CTIX Consortium Incentive Tokenomics (ERC-20)</span>
          </div>
          <p>
            To prevent free-riding and incentivize proactive threat sharing, organizations receive <strong>+25 CTIX tokens</strong> whenever an administrator and validator quorum approves their incident report. Balances determine consortium reputation ranks (Bronze, Silver, Gold, Platinum).
          </p>
        </div>

        {/* Smart Contracts Reference */}
        <div className="rounded-xl border border-line bg-bg p-4 flex flex-col gap-2 font-mono">
          <div className="flex items-center justify-between text-subtle text-[11px]">
            <span>ThreatReportLedger.sol:</span>
            <a
              href={getSepoliaContractUrl(SEPOLIA_CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent hover:underline flex items-center gap-1"
            >
              <span>{SEPOLIA_CONTRACT_ADDRESS}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="flex items-center justify-between text-subtle text-[11px]">
            <span>CTIToken.sol (CTIX):</span>
            <a
              href={getSepoliaContractUrl(CTIX_TOKEN_CONTRACT)}
              target="_blank"
              rel="noreferrer noopener"
              className="text-warn hover:underline flex items-center gap-1"
            >
              <span>{CTIX_TOKEN_CONTRACT}</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
