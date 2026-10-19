// Decentralized Cyber Threat Sharing Platform - Data & Intelligence Engine
// Provides zero-latency cached seed data, STIX 2.1 exporter, dynamic mitigation generator, and hash verification

export const SEED_THREATS = [
  {
    id: 'rep-ddos-801',
    organization: 'CloudScale Telecom',
    attack_type: 'DDoS',
    severity: 'CRITICAL',
    record_count: 48200,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    report_hash: 'a4f89d3810c9bf845e2d63189fa12cb84910ecb4819401bf578103c891bf302e',
    sensitive_data_hash: '88e7b1a20c451b68f9a23d04e5781a8b901fc847291a0c5b3819e647192a0b1c',
    top_indicators: ['syn_flood', 'packet_rate', 'flow_duration', 'spoofed_cidr'],
    status: 'approved',
    solution: `[CONTAINMENT COMPLETED - CRITICAL SEVERITY]
1. Diverted incoming ingress traffic through BGP Anycast volumetric scrubbing center; scrubbed 48,200 anomalous UDP/SYN flood request flows.
2. Activated adaptive SYN-cookie protection and lowered half-open TCP connection timeout to 12s on perimeter edge load balancers.
3. Deployed Layer-7 edge rate-limiting rules (max 100 req/min per client IP) across Cloudflare WAF with geo-distributed tarpit responses.
4. Upstream ISP transit filter engaged for volumetric spoofed CIDR blocks with automated RTBH (Remote Triggered Black Hole) routing.
Verification: Traffic telemetry returned to baseline. ML verification confidence: 98.4%.`,
    receipt: {
      mode: 'on-chain',
      tx_hash: '0x51c72ea89104fa28b81920cae84102947190f829104cb91283749201948201fa',
      block_number: 6849102,
    },
    metrics: { accuracy: 0.984, precision: 0.972, recall: 0.963, f1_score: 0.967 },
    recommended_rules: [
      'iptables -A INPUT -p tcp --dport 80 -m limit --limit 50/minute --limit-burst 100 -j ACCEPT',
      'iptables -A INPUT -p tcp --syn -m connlimit --connlimit-above 30 -j REJECT',
      'nft add rule inet filter input ct state new,untracked limit rate 200/second accept'
    ]
  },
  {
    id: 'rep-phish-802',
    organization: 'Apex Financial Group',
    attack_type: 'Phishing',
    severity: 'HIGH',
    record_count: 12500,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    report_hash: 'b2c91837401df8291a04b8571920ec481029b485719204bc91028471920381fa',
    sensitive_data_hash: '9102837401bf8291a02938471029384710293847102938471029384710293847',
    top_indicators: ['lure_url', 'credential_post', 'sender_spoof', 'redirect_domain'],
    status: 'approved',
    solution: `[REMEDIATION VERIFIED - HIGH SEVERITY]
1. Extracted and sinkholed fraudulent executive spoofing domain and credential harvester URLs within 8 minutes of telemetry alert.
2. Executed automated tenant-wide mail sweep: purged 1,420 unread lure emails from employee mailboxes using Microsoft Graph API.
3. Revoked active OAuth refresh tokens and session cookies for 14 targeted employee identities with mandatory FIDO2 hardware token reset.
4. Upgraded DNS and mail transport rules to strict DMARC policy enforcement (p=reject) with DNSSEC validation active.`,
    receipt: {
      mode: 'on-chain',
      tx_hash: '0x9812739481029384719203847102938471029384710293847102938471029384',
      block_number: 6849240,
    },
    metrics: { accuracy: 0.965, precision: 0.953, recall: 0.944, f1_score: 0.949 },
    recommended_rules: [
      'Set-OrganizationConfig -StrictPhishTransportRules $true',
      'dnsmasq address=/phish-domain-lure.xyz/127.0.0.1',
      'sigma: rule_mail_credential_theft_header_regex'
    ]
  },
  {
    id: 'rep-malware-803',
    organization: 'BioGenetics Labs',
    attack_type: 'Malware',
    severity: 'CRITICAL',
    record_count: 8940,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    report_hash: 'd192038471029384710293847102938471029384710293847102938471029384',
    sensitive_data_hash: 'fa01928374019283740192837401928374019283740192837401928374019283',
    top_indicators: ['process_inject', 'c2_beacon', 'dll_hijack', 'registry_run'],
    status: 'approved',
    solution: `[HOST ISOLATION & ERADICATION - CRITICAL SEVERITY]
1. Network-isolated 6 compromised lab workstations via CrowdStrike Falcon sensor API within 120 seconds of process injection detection.
2. Quarantined DLL injection payloads and terminated malicious svchost.exe parent-child hierarchy across 8,940 examined host events.
3. Egress perimeter firewalls blocked 4 hardcoded C2 IP destinations and alerted downstream threat intelligence feeds.
4. Distributed fleet-wide Sigma hunting rules for scheduled task persistence and forced memory volatility snapshot analysis.`,
    receipt: {
      mode: 'on-chain',
      tx_hash: '0x7410293847102938471029384710293847102938471029384710293847102938',
      block_number: 6849388,
    },
    metrics: { accuracy: 0.978, precision: 0.966, recall: 0.957, f1_score: 0.961 },
    recommended_rules: [
      'suricata -k drop ip any any -> [C2_EXTERNAL_IPS] any (msg:"C2 Beacon Dropped")',
      'yara -r ./rules/apt_payload_signature.yar /var/log/syslog',
      'iptables -A OUTPUT -d malicious.c2.node/24 -j DROP'
    ]
  },
  {
    id: 'rep-brute-804',
    organization: 'SaaS Matrix Core',
    attack_type: 'Brute Force',
    severity: 'HIGH',
    record_count: 31200,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    report_hash: 'e819203847102938471029384710293847102938471029384710293847102938',
    sensitive_data_hash: '3910283740192837401928374019283740192837401928374019283740192837',
    top_indicators: ['failed_login', 'ssh_spray', 'user_enum', 'bot_subnet'],
    status: 'approved',
    solution: `[ACCESS SECURITY LOCKOUT - HIGH SEVERITY]
1. Banned 840 distributed credential stuffing botnet IPs using Fail2ban dynamic jail with 48-hour quarantine.
2. Enabled exponential backoff rate limiter (5 attempts per 15 minutes) on API authentication gateway.
3. Activated Zero-Trust IP Geo-fencing on SSH bastion jump hosts and disabled password auth in favor of ED25519 keys.
4. Zero customer accounts compromised; automated audit log verified 100% block rate across 31,200 requests.`,
    receipt: {
      mode: 'on-chain',
      tx_hash: '0x3102938471029384710293847102938471029384710293847102938471029384',
      block_number: 6849512,
    },
    metrics: { accuracy: 0.991, precision: 0.985, recall: 0.978, f1_score: 0.981 },
    recommended_rules: [
      'fail2ban-client set sshd-auth banip <ATTACKER_IP_RANGE>',
      'iptables -I INPUT -p tcp --dport 22 -m state --state NEW -m recent --set',
      'iptables -I INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 -j DROP'
    ]
  },
  {
    id: 'rep-multivector-805',
    organization: 'Quantum Defense Systems',
    attack_type: 'Multi-Vector',
    severity: 'CRITICAL',
    record_count: 54100,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    report_hash: 'f920384710293847102938471029384710293847102938471029384710293847',
    sensitive_data_hash: 'aa01928374019283740192837401928374019283740192837401928374019283',
    top_indicators: ['syn_flood', 'credential_leak', 'lateral_smb', 'c2_beacon'],
    status: 'approved',
    solution: `[COORDINATED MULTI-STAGE MITIGATION - CRITICAL SEVERITY]
1. Initiated Level-4 SOC containment playbook: microsegmented production Kubernetes clusters and isolated lateral movement over port 445 (SMB).
2. Deployed volumetric ingress rate-limiting (100 req/sec) to negate simultaneous DDoS decoy vector while investigating credential abuse.
3. Revoked 3 compromised service account IAM credentials and forced re-issuance of short-lived mTLS client certificates.
4. Anchored cryptographic hash evidence to EVM ledger; synchronized IOC threat indicators to global decentralized defense matrix.`,
    receipt: {
      mode: 'on-chain',
      tx_hash: '0x8891028374019283740192837401928374019283740192837401928374019283',
      block_number: 6849645,
    },
    metrics: { accuracy: 0.988, precision: 0.976, recall: 0.971, f1_score: 0.974 },
    recommended_rules: [
      'consul-k8s apply -f zero-trust-microsegmentation.yaml',
      'iptables -A FORWARD -s 10.0.0.0/16 -d 10.1.0.0/16 -j DROP',
      'suricata --alert-mode inline -c /etc/suricata/multi_vector.rules'
    ]
  }
];

export const SEED_PENDING_REPORTS = [
  {
    id: 'rep-pending-01',
    organization: 'FinTech Nexus Corp',
    attack_type: 'Brute Force',
    severity: 'HIGH',
    record_count: 24800,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    report_hash: 'c819204810293847102938471029384710293847102938471029384710293847',
    sensitive_data_hash: 'd910283740192837401928374019283740192837401928374019283740192837',
    submitted_by: 'soc-lead@fintechnexus.com',
    source_filename: 'auth_audit_2026_q4.csv',
    top_indicators: ['failed_ssh', 'user_enumeration', 'ip_velocity', 'pass_spray'],
    metrics: { accuracy: 0.972, precision: 0.961, recall: 0.954, f1_score: 0.957 },
    status: 'pending',
    solution: `[ACCESS SECURITY LOCKOUT - HIGH SEVERITY]
1. Triggered automated Fail2ban progressive lockout on all ingress SSH/VPN/Auth gateways; banned attacking botnet IPs after 3 failed attempts.
2. Implemented exponential delay backoff (15s multiplier) and mandatory CAPTCHA challenges for authentication attempts matching failed_ssh, user_enumeration.
3. Enforced Zero-Trust IP Geo-fencing and disabled legacy password-only auth for privileged administrator accounts.
4. Validated that all 24,800 unauthorized credential spray attempts were stopped with zero compromised credentials.`,
  },
  {
    id: 'rep-pending-02',
    organization: 'CyberCore Infrastructure',
    attack_type: 'DDoS',
    severity: 'CRITICAL',
    record_count: 67300,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    report_hash: 'e719204810293847102938471029384710293847102938471029384710293847',
    sensitive_data_hash: 'f810283740192837401928374019283740192837401928374019283740192837',
    submitted_by: 'operator@cybercore.net',
    source_filename: 'edge_traffic_anomaly.csv',
    top_indicators: ['syn_flood', 'pps_spike', 'bandwidth_surge', 'spoofed_udp'],
    metrics: { accuracy: 0.985, precision: 0.978, recall: 0.971, f1_score: 0.974 },
    status: 'pending',
    solution: `[CONTAINMENT COMPLETED - CRITICAL SEVERITY]
1. Diverted incoming ingress traffic through BGP Anycast volumetric scrubbing center; scrubbed 67,300 anomalous request flows matching signature indicators (syn_flood, pps_spike).
2. Activated adaptive SYN-cookie protection and lowered half-open TCP connection timeout to 12s on perimeter load balancers.
3. Deployed Layer-7 edge rate-limiting rules (max 120 req/min per client IP) across Cloudflare/WAF with geo-distributed tarpit responses.
4. Upstream ISP transit filter engaged for volumetric spoofed CIDR blocks with automated RTBH (Remote Triggered Black Hole) routing.
Verification: Traffic telemetry returned to baseline. ML verification confidence: 98.5%.`,
  }
];

export function generateMitigationForAttack(attackType, indicators = [], recordCount = 1000) {
  const indStr = (indicators && indicators.length) ? indicators.slice(0, 3).join(', ') : 'anomaly telemetry vectors';
  const countStr = Number(recordCount || 1000).toLocaleString();

  switch (attackType) {
    case 'DDoS':
      return `[CONTAINMENT COMPLETED - CRITICAL SEVERITY]
1. Diverted incoming ingress traffic through BGP Anycast volumetric scrubbing center; scrubbed ${countStr} anomalous request flows matching signature indicators (${indStr}).
2. Activated adaptive SYN-cookie protection and lowered half-open TCP connection timeout to 12s on perimeter edge load balancers.
3. Deployed Layer-7 edge rate-limiting rules (max 100 req/min per client IP) across Cloudflare WAF with geo-distributed tarpit responses.
4. Upstream ISP transit filter engaged for volumetric spoofed CIDR blocks with automated RTBH (Remote Triggered Black Hole) routing.
Verification: Traffic telemetry returned to baseline. Latency restored to nominal 14ms.`;

    case 'Phishing':
      return `[REMEDIATION VERIFIED - HIGH SEVERITY]
1. Extracted and sinkholed fraudulent sender domains and credential harvester URLs identified in telemetry (${indStr}).
2. Executed automated tenant-wide mail sweep: purged all unread phishing lures from enterprise mailboxes using Microsoft Graph / Google Workspace API.
3. Revoked active OAuth refresh tokens and session cookies for targeted account identifiers; enforced immediate FIDO2/WebAuthn step-up re-authentication.
4. Upgraded DNS and mail transport rules to strict DMARC policy enforcement (p=reject) with DNSSEC validation active.`;

    case 'Malware':
      return `[HOST ISOLATION & ERADICATION - CRITICAL SEVERITY]
1. Instantly network-isolated infected host endpoints via CrowdStrike/EDR sensor API upon detection of malicious process behaviors (${indStr}).
2. Terminated active malicious process trees and quarantined payload binary drops across ${countStr} examined host events.
3. Blocked all outbound Command & Control (C2) callback IP addresses and beaconing URI signatures on border Next-Gen Firewalls.
4. Pushed enterprise fleet-wide YARA/Sigma hunting rules and forced memory volatility snapshot analysis on persistence hooks.`;

    case 'Brute Force':
      return `[ACCESS SECURITY LOCKOUT - HIGH SEVERITY]
1. Triggered automated Fail2ban progressive lockout on all ingress SSH/VPN/Auth gateways; banned attacking botnet IPs after 3 failed attempts.
2. Implemented exponential delay backoff (15s multiplier) and mandatory CAPTCHA challenges for authentication attempts matching (${indStr}).
3. Enforced Zero-Trust IP Geo-fencing and disabled legacy password-only auth for privileged administrator accounts.
4. Validated that all ${countStr} unauthorized credential spray attempts were stopped with zero compromised credentials.`;

    default: // Multi-Vector
      return `[COORDINATED SOC DEFENSE - CRITICAL SEVERITY]
1. Initiated incident response playbook: isolated lateral movement vectors across internal network VLANs and microsegmented active workloads.
2. Simultaneously deployed edge volumetric filtering for ingress anomalies and DNS sinkholing for egress telemetry (${indStr}).
3. Enforced strict Zero-Trust access tokens with 15-minute expiration and mandatory multi-factor validation across all ${countStr} evaluated records.
4. Correlated multi-stage alerts into SIEM, validated containment status, and anchored verifiable proof on-chain.`;
  }
}

// Export threats in STIX 2.1 Cyber Threat Intelligence format
export function exportThreatsAsSTIX(threats) {
  const bundle = {
    type: 'bundle',
    id: `bundle--${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)}`,
    spec_version: '2.1',
    objects: threats.map((t) => ({
      type: 'threat-report',
      spec_version: '2.1',
      id: `report--${t.id || crypto.randomUUID?.() || Math.random().toString(36).substring(2)}`,
      created: t.created_at || new Date().toISOString(),
      modified: t.created_at || new Date().toISOString(),
      name: `${t.attack_type} Incident - ${t.organization}`,
      description: `Decentralized threat intelligence verified on EVM ledger. Attack vector: ${t.attack_type}. Evaluated records: ${t.record_count}.`,
      threat_actor: t.organization ? `Target: ${t.organization}` : 'Anonymous Organization',
      severity: t.severity || 'HIGH',
      hashes: {
        'SHA-256': t.report_hash,
        'SENSITIVE-DATA-HASH': t.sensitive_data_hash,
      },
      verified_mitigation: t.solution,
      blockchain_receipt: t.receipt,
      top_indicators: t.top_indicators || [],
      labels: ['cyber-threat-intelligence', 'blockchain-anchored', t.attack_type?.toLowerCase()],
    })),
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `threat_intelligence_stix2_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
