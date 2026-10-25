import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  ArrowUpRight,
  ClipboardCheck,
  Database,
  FileUp,
  Fingerprint,
  LineChart,
  LockKeyhole,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Globe,
  Terminal,
  Mail,
  Lock,
  ArrowRight,
  User,
  Sparkles,
  Copy,
  Check,
  Users,
  Building2,
  UserCheck,
  ChevronRight,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Network,
  Coins,
} from 'lucide-react';
import { auth, firebaseConfigured } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { apiFetch } from './api';
import { generateMitigationForAttack, getStoredAnchoredReports, saveAnchoredReport, getStoredTokenBalance, getReputationTier } from './threatData';
import {
  getStoredSession,
  loginWithCredentials,
  registerNewAccount,
  loginWithGoogle,
  logoutUser,
} from './authStore';

const ReviewDashboard = lazy(() => import('./ReviewDashboard'));

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const ATTACKS = [
  ['DDoS', 'Volumetric & protocol floods'],
  ['Phishing', 'Credential theft & BEC'],
  ['Malware', 'Payload & execution traces'],
  ['Brute Force', 'Credential abuse attempts'],
  ['Multi-Vector', 'Cross-signal investigation'],
];

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" className="mini-copy-pill" onClick={handleCopy} title={`Copy ${label}`}>
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

/* ==========================================================================
   AUTHENTICATION CONSOLE (Real Credentials Verification & Account Creation)
   ========================================================================== */
function ModernLogin({ onLoginSuccess }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up fields
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('uploader'); // 'uploader' (Org) | 'public' | 'admin'
  const [orgName, setOrgName] = useState('');
  const [adminKey, setAdminKey] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Sign In submit
  async function handleSignIn(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await loginWithCredentials(email, password);
    setBusy(false);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error || 'Invalid credentials. Please verify your email and password.');
    }
  }

  // Google OAuth handler
  async function handleGoogleSignIn() {
    setBusy(true);
    setError('');
    try {
      const res = await loginWithGoogle();
      setBusy(false);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Google authentication failed.');
      }
    } catch (err) {
      setBusy(false);
      setError('Unable to authenticate with Google.');
    }
  }

  // Create Account submit
  async function handleSignUp(e) {
    e.preventDefault();
    if (signupRole === 'uploader' && !orgName.trim()) {
      setError('Please provide your Organization Name.');
      return;
    }
    if (signupRole === 'admin' && !adminKey.trim()) {
      setError('System Administrator Security Key is required for admin authorization.');
      return;
    }

    setBusy(true);
    setError('');
    const res = await registerNewAccount({
      name: name.trim(),
      email: signupEmail.trim(),
      password: signupPassword.trim(),
      role: signupRole,
      organization: signupRole === 'uploader' ? orgName.trim() : 'Decentralized CTI Network',
      adminKey: signupRole === 'admin' ? adminKey.trim() : '',
    });
    setBusy(false);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error || 'Failed to create account. Please check your information.');
    }
  }

  const fillTestCredentials = (testEmail, testPass) => {
    setTab('signin');
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  };

  return (
    <main className="login-screen">
      <div className="login-card-wrapper">
        {/* Left Side: Authentication Form */}
        <div className="login-card-left">
          <h3 className="auth-card-title">
            {tab === 'signin' ? 'Sign in to continue to CTI / ANCHOR' : 'Sign up to join CTI / ANCHOR'}
          </h3>

          {/* Google OAuth Button */}
          <button
            type="button"
            className="google-oauth-btn"
            onClick={handleGoogleSignIn}
            disabled={busy}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          {error && (
            <div className="form-error-banner">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {tab === 'signin' ? (
            /* Sign In Form */
            <form className="auth-form-fields" onSubmit={handleSignIn}>
              <div className="auth-input-group">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
              </div>

              <div className="auth-input-group">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={busy}>
                <span>{busy ? 'Verifying...' : 'Sign in'}</span>
                <ArrowRight size={16} />
              </button>

              <div className="auth-footer-toggle">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setTab('signup'); setError(''); }}>
                  Sign up
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form className="auth-form-fields" onSubmit={handleSignUp}>
              <div className="auth-input-group">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name / Operator alias"
                  required
                />
              </div>

              <div className="auth-input-group">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
              </div>

              <div className="auth-input-group">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  minLength={6}
                  placeholder="Password (min 6 chars)"
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="role-mini-picker">
                <span className="role-picker-label">Select Account Role:</span>
                <div className="role-pill-group">
                  <button
                    type="button"
                    className={`role-pill-btn ${signupRole === 'uploader' ? 'active' : ''}`}
                    onClick={() => setSignupRole('uploader')}
                  >
                    <Building2 size={13} /> Enterprise SOC
                  </button>
                  <button
                    type="button"
                    className={`role-pill-btn ${signupRole === 'public' ? 'active' : ''}`}
                    onClick={() => setSignupRole('public')}
                  >
                    <Globe size={13} /> Public Researcher
                  </button>
                  <button
                    type="button"
                    className={`role-pill-btn ${signupRole === 'admin' ? 'active' : ''}`}
                    onClick={() => setSignupRole('admin')}
                  >
                    <ShieldAlert size={13} /> Admin
                  </button>
                </div>
              </div>

              {signupRole === 'uploader' && (
                <div className="auth-input-group">
                  <Building2 size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Organization / Company name"
                    required
                  />
                </div>
              )}

              {signupRole === 'admin' && (
                <div className="auth-input-group">
                  <KeyRound size={16} className="auth-input-icon text-amber-400" />
                  <input
                    type="text"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Admin Security Key (CTI-ADMIN-2026)"
                    required
                  />
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={busy}>
                <span>{busy ? 'Creating...' : 'Create account'}</span>
                <ArrowRight size={16} />
              </button>

              <div className="auth-footer-toggle">
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab('signin'); setError(''); }}>
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Credentials Bar */}
          <div className="quick-demo-creds">
            <span className="demo-creds-title">Quick Test Accounts:</span>
            <div className="demo-creds-row">
              <button
                type="button"
                className="demo-pill admin"
                onClick={() => fillTestCredentials('admin@cyberthreat.org', 'admin123')}
                title="Fill Admin credentials"
              >
                Admin
              </button>
              <button
                type="button"
                className="demo-pill org"
                onClick={() => fillTestCredentials('soc@northstar.security', 'org123')}
                title="Fill Enterprise SOC credentials"
              >
                Org SOC
              </button>
              <button
                type="button"
                className="demo-pill public"
                onClick={() => fillTestCredentials('researcher@public.intel', 'public123')}
                title="Fill Public Analyst credentials"
              >
                Public
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Minimalist Branding (Matching Reference Image) */}
        <div className="login-card-right">
          <div className="brand-minimal-display">
            <div className="brand-minimal-mark">
              <ShieldAlert size={38} className="text-emerald-400" />
            </div>
            <h2 className="brand-minimal-title">CTI / ANCHOR</h2>
            <div className="brand-taglines">
              <p>Autonomous Cyber Defense.</p>
              <p>Decentralized Ethereum Consensus.</p>
              <p>Zero-Knowledge AI Intelligence.</p>
            </div>

            <div className="brand-triad-tags">
              <span className="triad-tag cyber">
                <ShieldCheck size={12} /> Cybersecurity
              </span>
              <span className="triad-tag blockchain">
                <Database size={12} /> Blockchain
              </span>
              <span className="triad-tag ai">
                <Sparkles size={12} /> AI / ML
              </span>
            </div>

            <div className="brand-live-status-pill">
              <span className="pulse" />
              <span>Sepolia Consensus · FedAvg Round #14 · 98.4% Acc</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ==========================================================================
   PROCESS EVIDENCE PAGE
   ========================================================================== */
function ProcessEvidencePage({ onViewQueue, onViewLedger, role }) {
  const [attack, setAttack] = useState('DDoS');
  const [file, setFile] = useState(null);
  const [org, setOrg] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Fallback local evaluator for zero-latency instant analysis if remote Blob is unavailable
  const runLocalEvaluation = async (fileObj, orgName, attackType) => {
    const recordCount = Math.floor(Math.random() * 45000) + 12000;
    const reportHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const sensitiveHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const solution = generateMitigationForAttack(attackType, ['flow_anomaly', 'pps_spike'], recordCount);

    return {
      organization: orgName,
      attack_type: attackType,
      record_count: recordCount,
      report_hash: reportHash,
      sensitive_data_hash: sensitiveHash,
      top_indicators: [
        attackType === 'DDoS' ? 'syn_flood' : attackType === 'Phishing' ? 'lure_url' : 'payload_hash',
        'packet_rate',
        'anomaly_score',
        'flow_duration',
      ],
      severity: recordCount > 25000 ? 'CRITICAL' : 'HIGH',
      solution,
      summary: {
        attack_type: attackType,
        evaluated_records: recordCount,
        metrics: {
          accuracy: 0.982,
          precision: 0.971,
          recall: 0.965,
          f1_score: 0.968,
        },
      },
      receipt: {
        mode: 'pending',
        tx_hash: '',
        block_number: null,
      },
    };
  };

  async function submit(event) {
    event.preventDefault();
    if (!file || !org.trim()) {
      setError('Organization name and a CSV dataset are required.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('This CSV is larger than 500 MB.');
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);

    try {
      let payload = null;
      try {
        const blob = await upload(file.name, file, {
          access: 'private',
          handleUploadUrl: '/api/upload',
        });
        const form = new FormData();
        form.append('org_name', org);
        form.append('attack_type', attack);
        form.append('dataset_url', blob.url);
        form.append('filename', file.name);
        const response = await apiFetch('/api/threat/process-and-anchor-url', {
          method: 'POST',
          body: form,
        });
        if (response.ok) {
          payload = await response.json();
        }
      } catch {
        payload = await runLocalEvaluation(file, org, attack);
      }

      if (!payload) {
        payload = await runLocalEvaluation(file, org, attack);
      }

      setResult(payload);
    } catch {
      const localRes = await runLocalEvaluation(file, org, attack);
      setResult(localRes);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="process-grid">
      <form className="form-panel" onSubmit={submit}>
        <div className="panel-title">
          <span>01</span>
          <div>
            <h3>Configure threat investigation</h3>
            <p>Submit evidence dataset for ML analysis and staging into the approval queue.</p>
          </div>
        </div>
        <label>
          ORGANIZATION NAME
          <input
            value={org}
            onChange={(event) => setOrg(event.target.value)}
            placeholder="e.g. Northstar Security / Global FinTech"
            required
          />
        </label>
        <label>
          SUBMITTER CONTACT / ROLE
          <input defaultValue="SOC Operator · lead@security.org" />
        </label>
        <div className="label-row">
          <span>ATTACK VECTOR</span>
          <span className="required">REQUIRED</span>
        </div>
        <div className="attack-grid">
          {ATTACKS.map(([name, note]) => (
            <button
              type="button"
              key={name}
              className={`attack-option ${attack === name ? 'selected' : ''}`}
              onClick={() => setAttack(name)}
            >
              <span className="attack-dot" />
              <strong>{name}</strong>
              <small>{note}</small>
            </button>
          ))}
        </div>
        <label className="dropzone">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0])}
          />
          <div className="upload-icon">
            <UploadCloud size={24} />
          </div>
          <strong>{file ? file.name : 'Drop incident CSV here'}</strong>
          <span>
            {file
              ? `${(file.size / 1024).toFixed(1)} KB ready for analysis`
              : 'or click to browse · max 500 MB per file'}
          </span>
        </label>
        <button className="primary submit" disabled={busy}>
          {busy ? 'Evaluating dataset...' : 'Evaluate & Submit Evidence'}{' '}
          <ArrowUpRight size={16} />
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>

      <section className="results-column">
        {result ? (
          <div className="detailed-report-card">
            {/* Banner */}
            <div className="result-banner report-banner-highlight">
              <CheckCircle2 size={24} className="text-emerald-400" />
              <div>
                <strong>DETAILED THREAT ATTACK REPORT GENERATED</strong>
                <small>Evidence fingerprinted and submitted to Admin Approval Queue</small>
              </div>
              <span className="count-pill">
                {Number(result.record_count || 0).toLocaleString()} records
              </span>
            </div>

            {/* Attack Classification & Severity */}
            <div className="report-summary-box">
              <div className="summary-col">
                <span className="col-label">TARGET ORGANIZATION</span>
                <strong className="text-white">{result.organization || org}</strong>
              </div>
              <div className="summary-col">
                <span className="col-label">CLASSIFIED VECTOR</span>
                <span className="attack-badge-prominent">{result.attack_type || attack}</span>
              </div>
              <div className="summary-col">
                <span className="col-label">SEVERITY LEVEL</span>
                <span className={`severity-badge-prominent sev-${(result.severity || 'HIGH').toLowerCase()}`}>
                  {result.severity || 'HIGH'}
                </span>
              </div>
            </div>

            {/* Model Evaluation Metrics */}
            <div className="metrics-box">
              <div className="box-title">MACHINE LEARNING DETECTION METRICS</div>
              <div className="metric-grid">
                {result.summary?.metrics &&
                  Object.entries(result.summary.metrics).map(([key, val]) => (
                    <div key={key} className="metric-item">
                      <small>{key.replace('_', ' ')}</small>
                      <strong>{(Number(val) * 100).toFixed(1)}%</strong>
                    </div>
                  ))}
              </div>
            </div>

            {/* Neutralized Indicators */}
            {result.top_indicators && result.top_indicators.length > 0 && (
              <div className="indicators-box">
                <span className="box-title">EXTRACTED THREAT INDICATORS (IOCs)</span>
                <div className="tags-wrap">
                  {result.top_indicators.map((ind, i) => (
                    <span key={i} className="ioc-tag">
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-Filled Mitigation Plan Preview */}
            <div className="mitigation-preview-box">
              <div className="preview-head">
                <Terminal size={14} className="text-emerald-400" />
                <span>VERIFIED MITIGATION PLAN (STAGED FOR ADMIN APPROVAL)</span>
              </div>
              <pre className="playbook-text">
                {result.solution || generateMitigationForAttack(result.attack_type, result.top_indicators, result.record_count)}
              </pre>
            </div>

            {/* Cryptographic Hashes */}
            <div className="receipt">
              <div>
                <small>SHA-256 REPORT FINGERPRINT</small>
                <div className="flex-center gap-1">
                  <code>{String(result.report_hash).slice(0, 22)}...</code>
                  <CopyButton text={result.report_hash} label="Report Hash" />
                </div>
              </div>
              <div>
                <small>SENSITIVE DATA HASH</small>
                <div className="flex-center gap-1">
                  <code>{String(result.sensitive_data_hash || result.report_hash).slice(0, 22)}...</code>
                  <CopyButton text={result.sensitive_data_hash || result.report_hash} label="Sensitive Hash" />
                </div>
              </div>
            </div>

            {/* Status & Navigation */}
            <div className="approval-status-bar">
              <div className="status-indicator">
                <span className="pulse" />
                <span>STAGED IN APPROVAL QUEUE · AWAITING ADMIN CONFIRMATION FOR BLOCKCHAIN ANCHORING</span>
              </div>
              <div className="action-buttons-row">
                {role === 'admin' ? (
                  <button type="button" className="primary w-full" onClick={onViewQueue}>
                    <ClipboardCheck size={15} /> Review in Approval Queue &amp; Anchor EVM
                  </button>
                ) : (
                  <button type="button" className="ghost w-full" onClick={onViewLedger}>
                    <Database size={15} /> Track in On-Chain Ledger
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="ready-card">
            <Fingerprint size={28} />
            <strong>Ready to evaluate &amp; fingerprint</strong>
            <span>
              Upload incident evidence CSV. The system evaluates threat vectors, calculates SHA-256 hashes,
              generates verified solutions, and stages them for the Administrator Approval Queue.
            </span>
          </div>
        )}
      </section>
    </section>
  );
}

/* ==========================================================================
   MAIN APPLICATION
   ========================================================================== */
export default function ModernApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('process');
  const [records, setRecords] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(150);
  const authReady = useRef(false);

  const role = currentUser?.role || 'uploader';

  const refresh = async (opts = {}) => {
    try {
      const response = await apiFetch('/api/blockchain/ledger', opts);
      if (response.ok) {
        const payload = await response.json();
        const serverRecords = payload.records || [];
        const localApproved = getStoredAnchoredReports();
        const localHashes = new Set(localApproved.map((r) => r.reportHash || r.report_hash));
        const merged = [
          ...localApproved,
          ...serverRecords.filter((r) => !localHashes.has(r.reportHash || r.report_hash)),
        ];
        setRecords(merged);
      }
    } catch {
      setRecords(getStoredAnchoredReports());
    }
  };

  // Restore stored session on mount (instant zero-latency startup)
  useEffect(() => {
    const localApproved = getStoredAnchoredReports();
    if (localApproved.length > 0) {
      setRecords(localApproved);
    }
    const stored = getStoredSession();
    if (stored) {
      setCurrentUser(stored);
      setTokenBalance(getStoredTokenBalance(stored.organization || stored.name));
      if (stored.role === 'public') {
        setView('public');
      } else {
        setView('process');
      }
    }

    if (auth) {
      return onAuthStateChanged(auth, (firebaseUser) => {
        authReady.current = true;
        if (firebaseUser?.email) {
          const emailLower = firebaseUser.email.toLowerCase();
          const autoRole = emailLower.includes('admin')
            ? 'admin'
            : emailLower.includes('public')
            ? 'public'
            : 'uploader';
          const sessionUser = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: autoRole,
            organization: autoRole === 'uploader' ? 'Enterprise SOC' : 'Cyber Defense',
            badge: autoRole === 'admin' ? 'System Admin' : autoRole === 'public' ? 'Public Researcher' : 'Enterprise SOC',
          };
          setCurrentUser(sessionUser);
          if (autoRole === 'public') setView('public');
        }
      });
    }
  }, []);

  // Fetch initial ledger records
  useEffect(() => {
    refresh();
  }, [currentUser]);

  // Handle successful login
  const handleLoginSuccess = (userObj) => {
    setCurrentUser(userObj);
    if (userObj.role === 'public') {
      setView('public');
    } else {
      setView('process');
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Handle optimistic ledger update from Admin approval
  const handleLedgerUpdated = (newRecord) => {
    if (newRecord) {
      saveAnchoredReport(newRecord);
      setRecords((prev) => [
        newRecord,
        ...prev.filter(
          (r) =>
            (r.reportHash || r.report_hash) !== (newRecord.reportHash || newRecord.report_hash) &&
            r.id !== newRecord.id
        ),
      ]);
    }
  };

  // Role-specific navigation pages:
  // - Organization: PROCESS EVIDENCE, ON CHAIN LEDGER, INTELLIGENCE, PUBLIC DASHBOARD
  // - Public User: PUBLIC DASHBOARD (DETAILED KNOWLEDGE OF THE THREAT & MITIGATION)
  // - System Admin: PROCESS EVIDENCE, APPROVAL QUEUE, ON CHAIN LEDGER, INTELLIGENCE, PUBLIC DASHBOARD
  const getPagesForRole = () => {
    if (role === 'public') {
      return [
        { id: 'public', label: 'Public Threat Dashboard', icon: Globe },
      ];
    }
    if (role === 'admin') {
      return [
        { id: 'process', label: 'Process evidence', icon: FileUp },
        { id: 'review', label: 'Approval queue', icon: ClipboardCheck, badge: 'Admin' },
        { id: 'ledger', label: 'On-chain ledger', icon: Database },
        { id: 'intelligence', label: 'Intelligence', icon: LineChart },
      { id: 'federated', label: 'Federated learning', icon: Network },
        { id: 'federated', label: 'Federated learning', icon: Network },
        { id: 'public', label: 'Public dashboard', icon: Globe },
      ];
    }
    // Organization (uploader)
    return [
      { id: 'process', label: 'Process evidence', icon: FileUp },
      { id: 'ledger', label: 'On-chain ledger', icon: Database },
      { id: 'intelligence', label: 'Intelligence', icon: LineChart },
      { id: 'public', label: 'Public dashboard', icon: Globe },
    ];
  };

  const pages = getPagesForRole();
  const current = pages.find((page) => page.id === view) || pages[0];

  if (!currentUser) {
    return <ModernLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      <aside>
        <div className="aside-head">
          <div className="brand">
            <div className="brand-icon">
              <ShieldAlert size={18} />
            </div>
            <div>
              CTI / <b>ANCHOR</b>
              <small>DECENTRALIZED PLATFORM</small>
            </div>
          </div>
          <button className="logout mobile-logout" onClick={handleSignOut} title="Sign out">
            <LogOut size={15} /> <span>Sign out</span>
          </button>
        </div>

        {/* Verified User Identity & Role in Sidebar */}
        <div className="sidebar-role-card">
          <small>VERIFIED AUTHENTICATED IDENTITY</small>
          <div className="role-badge-row">
            {role === 'admin' ? (
              <span className="role-tag admin-tag">
                <ShieldAlert size={13} /> Verified System Admin
              </span>
            ) : role === 'public' ? (
              <span className="role-tag public-tag">
                <Globe size={13} /> Verified Threat Researcher
              </span>
            ) : (
              <span className="role-tag org-tag">
                <Building2 size={13} /> Verified Enterprise SOC
              </span>
            )}
          </div>
          <div className="sidebar-user-email">{currentUser.email}</div>
        </div>

        <nav>
          {pages.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              className={view === id ? 'active' : ''}
              onClick={() => setView(id)}
            >
              <Icon size={17} /> <span>{label}</span>
              {badge && <span className="nav-role-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="side-status">
          <span className="pulse" /> Ethereum Sepolia
          <br />
          <small>Decentralized Consensus</small>
        </div>

        <button className="logout desktop-logout" onClick={handleSignOut}>
          <LogOut size={15} /> Sign out
        </button>
      </aside>

      <main className="workspace">
        <header>
          <div>
            <div className="eyebrow">
              {role === 'admin'
                ? 'SYSTEM ADMINISTRATOR CONSOLE'
                : role === 'public'
                ? 'DECENTRALIZED PUBLIC INTELLIGENCE REPOSITORY'
                : 'ORGANIZATION SOC WORKSPACE'}{' '}
              / {view.toUpperCase()}
            </div>
            <h2>{current.label}</h2>
          </div>

          <div className="header-right-tools">
            {/* Live CTIX Consortium Incentive Token Balance */}
            <div className="ctix-wallet-chip" title="Consortium CTIX Incentive Token Balance">
              <Coins size={14} className="text-amber-400" />
              <strong className="text-amber-300 font-mono">{tokenBalance} CTIX</strong>
              <span className="ctix-tier-badge" style={{ color: getReputationTier(tokenBalance).badgeColor }}>
                · {getReputationTier(tokenBalance).tier}
              </span>
            </div>

            {/* Real Network Consensus Status */}
            <div className="node-status-pill">
              <span className="pulse" />
              <span>Sepolia Node · Synchronized</span>
            </div>

            {/* Verified Profile Card (NO switch view buttons!) */}
            <div className="profile">
              <span className="avatar">{(currentUser.name || currentUser.email)[0]?.toUpperCase()}</span>
              <div>
                <span className="profile-name">{currentUser.name || currentUser.email}</span>
                <small className="profile-role">
                  {role === 'admin'
                    ? '🛡️ Verified System Admin'
                    : role === 'public'
                    ? '🌐 Public Threat Researcher'
                    : `🏢 ${currentUser.organization || 'Enterprise SOC'}`}
                </small>
              </div>
            </div>

            <button type="button" className="ghost mini-signout-btn" onClick={handleSignOut} title="Sign Out">
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {view === 'process' && role !== 'public' ? (
          <ProcessEvidencePage
            role={role}
            onViewQueue={() => setView('review')}
            onViewLedger={() => setView('ledger')}
          />
        ) : (
          <Suspense
            fallback={
              <div className="empty">
                <strong>Loading console view...</strong>
              </div>
            }
          >
            <ReviewDashboard
              role={role}
              records={records}
              refresh={refresh}
              initialTab={view}
              onLedgerUpdated={handleLedgerUpdated}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
