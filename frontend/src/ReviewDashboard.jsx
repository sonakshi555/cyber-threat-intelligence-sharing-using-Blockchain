import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, ClipboardCheck, Database, LineChart, XCircle } from 'lucide-react';
import { apiFetch } from './api';

function AdminQueue() {
  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [solutions, setSolutions] = useState({});
  const [notes, setNotes] = useState({});

  async function load() {
    const response = await apiFetch('/api/reports/pending');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || 'Unable to load pending reports');
    setReports(payload.reports || []);
  }

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);

  async function review(report, action) {
    const previousReports = reports;
    setBusy(true);
    setMessage('');
    setReports((current) => current.filter((item) => item.id !== report.id));
    setMessage(action === 'approve' ? 'Anchoring report on-chain...' : 'Rejecting report...');
    try {
      const response = await apiFetch(`/api/reports/${report.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution: solutions[report.id] || '', review_note: notes[report.id] || '' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Review failed');
      setMessage(action === 'approve' ? 'Report approved and anchored on-chain.' : 'Report rejected and kept off-chain.');
    } catch (error) {
      setReports(previousReports);
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="review-panel"><div className="section-heading"><div><div className="eyebrow">ADMINISTRATOR QUEUE</div><h2>Review evidence</h2></div><span className="tag">{reports.length} pending</span></div>{message && <p className="form-error">{message}</p>}{reports.length ? <div className="review-list">{reports.map((report) => <article className="review-card" key={report.id}><div className="review-card-head"><div><strong>{report.organization}</strong><small>{report.attack_type} · {Number(report.record_count).toLocaleString()} rows · submitted by {report.submitted_by || 'operator'}</small></div><span className="status-pending">PENDING</span></div><div className="review-hashes"><span>REPORT {String(report.report_hash).slice(0, 18)}...</span><span>SENSITIVE {String(report.sensitive_data_hash).slice(0, 18)}...</span></div><label>SOLUTION TAKEN<textarea value={solutions[report.id] || ''} onChange={(event) => setSolutions((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Describe the verified mitigation or response" /></label><label>REVIEW NOTE<textarea value={notes[report.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Optional approval or rejection note" /></label><div className="review-actions"><button className="primary" disabled={busy} onClick={() => review(report, 'approve')}><CheckCircle2 size={15} /> Approve & anchor</button><button className="ghost" disabled={busy} onClick={() => review(report, 'reject')}><XCircle size={15} /> Reject</button></div></article>)}</div> : <div className="empty"><ClipboardCheck size={28} /><strong>No reports awaiting review</strong><span>New submissions will appear here before blockchain anchoring.</span></div>}</section>;
}

function Intelligence() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => { apiFetch('/api/dashboard/summary').then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.detail || 'Unable to load dashboard'); setSummary(payload); }).catch((error) => setMessage(error.message)); }, []);
  if (message) return <div className="empty"><LineChart size={28} /><strong>{message}</strong><span>Approved intelligence will appear after administrator review.</span></div>;
  if (!summary) return <div className="empty"><strong>Loading intelligence...</strong></div>;
  const attackData = Object.entries(summary.by_attack || {}).map(([name, value]) => ({ name, value }));
  return <section className="intelligence-panel"><div className="section-heading"><div><div className="eyebrow">VERIFIED INTELLIGENCE</div><h2>Threat landscape</h2></div><span className="tag">Approved only</span></div><div className="intel-stats"><div><span>APPROVED REPORTS</span><strong>{summary.total_reports}</strong></div><div><span>COMPANIES</span><strong>{summary.total_companies}</strong></div><div><span>THREAT VECTORS</span><strong>{attackData.length}</strong></div></div><div className="chart-panel"><h3>Threats by attack vector</h3><ResponsiveContainer width="100%" height={260}><BarChart data={attackData}><CartesianGrid strokeDasharray="3 3" stroke="#dfe6d8" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#bddb25" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="company-list"><h3>Company intelligence</h3>{Object.entries(summary.by_company || {}).map(([company, count]) => <div key={company}><span>{company}</span><strong>{count} approved report{count === 1 ? '' : 's'}</strong></div>)}</div></section>;
}

export default function ReviewDashboard({ records, refresh, initialTab = 'ledger' }) {
  const [tab, setTab] = useState(initialTab);
  const [role, setRole] = useState('uploader');
  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => { apiFetch('/api/me').then((response) => response.ok ? response.json() : null).then((profile) => { if (profile) setRole(profile.role); }); }, []);
  return <section className="ledger-view"><div className="dashboard-tabs"><button className={tab === 'ledger' ? 'active' : ''} onClick={() => setTab('ledger')}><Database size={15} /> On-chain ledger</button>{role === 'admin' && <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}><ClipboardCheck size={15} /> Approval queue</button>}<button className={tab === 'intelligence' ? 'active' : ''} onClick={() => setTab('intelligence')}><LineChart size={15} /> Intelligence</button></div>{tab === 'review' && role === 'admin' ? <AdminQueue /> : tab === 'intelligence' ? <Intelligence /> : <section><div className="section-heading"><div><div className="eyebrow">IMMUTABLE RECORDS</div><h2>On-chain ledger</h2></div><button className="ghost" onClick={refresh}><Database size={15} /> Refresh ledger</button></div>{records.length ? <div className="table-wrap"><table><thead><tr><th>ID</th><th>Organization</th><th>Vector</th><th>Records</th><th>Report hash</th><th>Block</th></tr></thead><tbody>{records.map((record) => <tr key={`${record.id}-${record.reportHash}`}><td>#{record.id}</td><td>{record.organizationName}</td><td><span className="tag">{record.attackType}</span></td><td>{Number(record.totalRecordsEvaluated).toLocaleString()}</td><td className="hash">{String(record.reportHash).slice(0, 16)}...</td><td>{record.blockNumber || 'simulated'}</td></tr>)}</tbody></table></div> : <div className="empty"><Database size={28} /><strong>No approved reports yet</strong><span>Reports appear after administrator approval.</span></div>}</section>}</section>;
}
