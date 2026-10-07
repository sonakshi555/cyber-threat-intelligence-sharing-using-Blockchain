import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Activity, ArrowUpRight, Blocks, CheckCircle2, ClipboardCheck, Database, FileUp, Fingerprint, LineChart, LockKeyhole, LogOut, ShieldAlert, UploadCloud } from 'lucide-react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase';
import { apiFetch } from './api';
import ReviewDashboard from './ReviewDashboard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const ATTACKS = [
  ['DDoS', 'Volumetric & protocol floods'], ['Phishing', 'Credential theft & BEC'],
  ['Malware', 'Payload & execution traces'], ['Brute Force', 'Credential abuse attempts'], ['Multi-Vector', 'Cross-signal investigation']
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!firebaseConfigured || !auth) {
      setError('Firebase is not configured. Add the VITE_FIREBASE_* values before signing in.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (authError) {
      const messages = {
        'auth/configuration-not-found': 'Enable Email/Password in Firebase Authentication > Sign-in method.',
        'auth/operation-not-allowed': 'Enable Email/Password in Firebase Authentication > Sign-in method.',
        'auth/invalid-api-key': 'Check the Firebase Web API key in the Vercel Production environment.',
        'auth/email-already-in-use': 'This email already has an account. Switch to Sign in.',
        'auth/weak-password': 'Use a password with at least 6 characters.',
      };
      setError(messages[authError.code] || authError.code?.replace('auth/', '').replaceAll('-', ' ') || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-screen"><div className="login-mark"><ShieldAlert size={21} /> CTI / ANCHOR</div><section className="login-panel"><div className="eyebrow">SECURE OPERATIONS CONSOLE <span>v1.0</span></div><h1>Make threat<br /><em>evidence</em> permanent.</h1><p className="muted">Analyze incident data, fingerprint sensitive evidence, and anchor the result to an immutable ledger.</p><form className="login-fields" onSubmit={submit}><label>WORK EMAIL<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="operator@northstar.security" required /></label><label>PASSWORD<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength="6" required /></label>{error && <p className="form-error">{error}</p>}<button className="primary full" disabled={busy}>{busy ? 'Authenticating...' : mode === 'signup' ? 'Create account' : 'Enter workspace'} <ArrowUpRight size={16} /></button></form><button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>{mode === 'signin' ? 'Create a new account' : 'Already have an account? Sign in'}</button><div className="login-foot"><LockKeyhole size={14} /> Firebase Authentication · Secure session</div></section><div className="login-orbit"><div className="orbit-core"><Fingerprint size={40} /><strong>SHA-256</strong><small>TRUST LAYER</small></div></div></main>;
}

function Dropzone({ file, onFile }) { return <label className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFile(event.dataTransfer.files?.[0]); }}><input type="file" accept=".csv,text/csv" onChange={(event) => onFile(event.target.files?.[0])} /><div className="upload-icon"><UploadCloud size={24} /></div><strong>{file ? file.name : 'Drop incident CSV here'}</strong><span>{file ? `${(file.size / 1024).toFixed(1)} KB ready for analysis` : 'or click to browse · max 500 MB per file'}</span></label>; }

function Ledger({ records, refresh, initialTab = 'ledger' }) { return <ReviewDashboard records={records} refresh={refresh} initialTab={initialTab} />; }

export default function App() {
  const [user, setUserState] = useState(null), [view, setView] = useState('process'), [attack, setAttack] = useState('DDoS'), [file, setFile] = useState(null), [org, setOrg] = useState(''), [result, setResult] = useState(null), [records, setRecords] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const authReady = useRef(!auth);
  const refresh = async () => { try { const response = await apiFetch('/api/blockchain/ledger'); if (response.ok) setRecords((await response.json()).records || []); } catch { setRecords((current) => current); } };
  useEffect(() => { if (!auth) return undefined; return onAuthStateChanged(auth, (firebaseUser) => { authReady.current = true; setUserState(firebaseUser?.email || null); }); }, []);
  useEffect(() => { if (authReady.current && auth && user === null) signOut(auth); }, [user]);
  useEffect(() => { if (user) refresh(); }, [user]);
  async function submit(event) { event.preventDefault(); if (!file || !org.trim()) { setError('Organization name and a CSV dataset are required.'); return; } if (file.size > MAX_UPLOAD_BYTES) { setError('This CSV is larger than 500 MB.'); return; } setError(''); setBusy(true); setResult(null); try { const blob = await upload(file.name, file, { access: 'private', handleUploadUrl: '/api/upload' }); const form = new FormData(); form.append('org_name', org); form.append('attack_type', attack); form.append('dataset_url', blob.url); form.append('filename', file.name); const response = await apiFetch('/api/threat/process-and-anchor-url', { method: 'POST', body: form }); const payload = await response.json(); if (!response.ok) throw new Error(payload.detail || 'Processing failed'); setResult(payload); await refresh(); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } }
  if (!user) return <Login />;
  return <div className="app-shell"><aside><div className="brand"><div className="brand-icon"><ShieldAlert size={18} /></div><div>CTI / <b>ANCHOR</b><small>THREAT INTELLIGENCE</small></div></div><nav><button className={view === 'process' ? 'active' : ''} onClick={() => setView('process')}><FileUp size={17} /> Process evidence</button><button className={view === 'ledger' ? 'active' : ''} onClick={() => setView('ledger')}><Database size={17} /> On-chain ledger</button></nav><div className="side-status"><span className="pulse" /> Local network<br /><small>RPC fallback enabled</small></div><button className="logout" onClick={() => setUserState(null)}><LogOut size={15} /> Sign out</button></aside><main className="workspace"><header><div><div className="eyebrow">THREAT OPERATIONS / {view === 'process' ? 'INGEST' : 'LEDGER'}</div><h2>{view === 'process' ? 'Anchor an incident' : 'Evidence registry'}</h2></div><div className="profile"><span className="avatar">{user[0]}</span><span>{user}<small>Authenticated role</small></span></div></header>{view === 'ledger' ? <Ledger records={records} refresh={refresh} /> : <section className="process-grid"><form className="form-panel" onSubmit={submit}><div className="panel-title"><span>01</span><div><h3>Configure investigation</h3><p>Define the evidence context before analysis.</p></div></div><label>ORGANIZATION NAME<input value={org} onChange={(event) => setOrg(event.target.value)} placeholder="e.g. Northstar Security" /></label><label>SUBMITTER CONTACT / ROLE<input defaultValue="SOC Operator · operator@northstar.security" /></label><div className="label-row"><span>ATTACK VECTOR</span><span className="required">REQUIRED</span></div><div className="attack-grid">{ATTACKS.map(([name, note]) => <button type="button" key={name} className={`attack-option ${attack === name ? 'selected' : ''}`} onClick={() => setAttack(name)}><span className="attack-dot" /><strong>{name}</strong><small>{note}</small></button>)}</div><Dropzone file={file} onFile={setFile} />{error && <div className="error">{error}</div>}<button className="primary full process-button" disabled={busy}>{busy ? 'Running pipeline...' : <>Evaluate & anchor <ArrowUpRight size={17} /></>}</button></form><section className="result-column"><div className="pipeline-card"><div className="panel-title"><span>02</span><div><h3>Pipeline status</h3><p>Three-stage evidence processing.</p></div></div>{['Ingesting CSV', 'Evaluating threat model', 'Anchoring to EVM'].map((step, index) => <div className={`step ${result || (busy && index === 0) ? 'done' : ''}`} key={step}><span>0{index + 1}</span><div><strong>{step}</strong><small>{['Validate and normalize rows', 'Extract indicators and metrics', 'Commit fingerprints to ledger'][index]}</small></div>{result && <CheckCircle2 size={17} />}</div>)}</div>{result ? <div className="results-card"><div className="result-banner"><CheckCircle2 size={19} /><div><strong>Evidence anchored</strong><small>{result.receipt.mode === 'on-chain' ? 'Verified on local EVM network' : 'RPC offline · simulation receipt issued'}</small></div><span>{result.record_count.toLocaleString()} rows</span></div><div className="metric-grid">{Object.entries(result.summary.metrics).map(([key, value]) => <div key={key}><small>{key.replace('_', ' ')}</small><strong>{(value * 100).toFixed(1)}%</strong></div>)}</div><div className="receipt"><div><small>TRANSACTION HASH</small><code>{result.receipt.tx_hash.slice(0, 26)}...</code></div><div><small>BLOCK NUMBER</small><code>{result.receipt.block_number || 'SIMULATED'}</code></div></div></div> : <div className="ready-card"><Fingerprint size={25} /><strong>Ready to fingerprint</strong><span>Your report and sensitive fields receive separate SHA-256 hashes before anchoring.</span></div>}</section></section>}</main></div>;
}
