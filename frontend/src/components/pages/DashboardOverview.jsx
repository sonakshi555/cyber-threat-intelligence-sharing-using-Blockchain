import { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  Coins,
  ArrowUpRight,
  TrendingUp,
  FileUp,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardHeader, StatCard, SeverityBadge, Button, SectionHeader } from '../ui/primitives';
import { HashDisplay, DataTable } from '../ui/overlays';
import { AttackBadge, ConsensusBadge, ConfidenceMeter } from '../ui/domain';
import { getSepoliaBlockUrl } from '../../threatData';

export function DashboardOverview({
  threats = [],
  pendingCount = 0,
  tokenBalance = 150,
  onNavigate,
  onInspectProof,
  role,
}) {
  // Compute metrics
  const totalRecords = useMemo(
    () => threats.reduce((sum, t) => sum + (Number(t.record_count) || 0), 0),
    [threats]
  );

  const avgAccuracy = useMemo(() => {
    if (!threats.length) return '98.4';
    const total = threats.reduce(
      (sum, t) => sum + (Number(t.metrics?.accuracy || 0.984) * 100),
      0
    );
    return (total / threats.length).toFixed(1);
  }, [threats]);

  // Attack vectors bar chart data
  const vectorChartData = useMemo(() => {
    const counts = {};
    threats.forEach((t) => {
      const v = t.attack_type || 'Unknown';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [threats]);

  // Severity donut data
  const severityChartData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    threats.forEach((t) => {
      const s = (t.severity || 'HIGH').toUpperCase();
      if (s === 'CRITICAL') counts.Critical += 1;
      else if (s === 'HIGH') counts.High += 1;
      else if (s === 'MEDIUM') counts.Medium += 1;
      else counts.Low += 1;
    });
    return [
      { name: 'Critical', value: counts.Critical, color: '#f43f5e' },
      { name: 'High', value: counts.High, color: '#f59e0b' },
      { name: 'Medium', value: counts.Medium, color: '#38bdf8' },
      { name: 'Low', value: counts.Low, color: '#10b981' },
    ].filter((item) => item.value > 0);
  }, [threats]);

  // Recent 5 threats for summary table
  const recentThreats = useMemo(() => threats.slice(0, 5), [threats]);

  const columns = [
    {
      key: 'organization',
      header: 'Target Entity',
      render: (t) => (
        <div className="flex flex-col">
          <strong className="text-fg font-medium">{t.organization}</strong>
          <span className="text-[11px] text-subtle font-mono">
            {new Date(t.created_at).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'attack_type',
      header: 'Vector',
      render: (t) => <AttackBadge type={t.attack_type} />,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (t) => <SeverityBadge severity={t.severity} />,
    },
    {
      key: 'record_count',
      header: 'Evaluated Telemetry',
      render: (t) => (
        <span className="font-mono text-xs text-muted">
          {Number(t.record_count || 0).toLocaleString()} flows
        </span>
      ),
      hideBelow: 'md',
    },
    {
      key: 'report_hash',
      header: 'SHA-256 Fingerprint',
      render: (t) => (
        <HashDisplay
          value={t.report_hash}
          label="Report Hash"
          head={8}
          tail={6}
          href={getSepoliaBlockUrl(t.receipt?.block_number || 6849102)}
        />
      ),
      hideBelow: 'lg',
    },
    {
      key: 'actions',
      header: 'Verification Proof',
      headClassName: 'text-right',
      render: (t) => (
        <div className="flex justify-end gap-2">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => onInspectProof(t)}
            icon={ShieldCheck}
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <SectionHeader
        eyebrow="Consortium Telemetry Overview"
        title="Decentralized Threat Intelligence Command"
        description="Publicly verifiable threat classification and mitigation playbooks anchored on Ethereum Sepolia. Private internal IP topologies remain strictly masked with SHA-256 hashes."
        actions={
          <div className="flex items-center gap-2.5">
            {role !== 'public' && (
              <Button
                variant="gradient"
                size="md"
                onClick={() => onNavigate('submit')}
                icon={FileUp}
              >
                Submit Evidence
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('feed')}
            >
              Browse Full Feed
            </Button>
          </div>
        }
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="ANCHORED INCIDENTS"
          value={threats.length}
          trend="+100% On-Chain"
          hint="EVM smart contract consensus finalized"
          icon={Database}
          tone="ok"
        />

        <StatCard
          label="EVALUATED FLOW RECORDS"
          value={totalRecords.toLocaleString()}
          trend="Zero-Knowledge"
          hint="SHA-256 hashed privacy shield active"
          icon={ShieldCheck}
          tone="accent"
        />

        <StatCard
          label="AVERAGE DETECTION ACCURACY"
          value={`${avgAccuracy}%`}
          trend="AUC = 0.992"
          hint="Ensemble classifier with SHAP attribution"
          icon={Cpu}
          tone="ai"
        />

        <StatCard
          label="CONSORTIUM CTIX BALANCE"
          value={`${tokenBalance} CTIX`}
          trend="+25 / Verified Report"
          hint="Active reward incentive tier"
          icon={Coins}
          tone="warn"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Threat Activity by Vector Bar Chart (2 cols) */}
        <Card className="p-5 lg:col-span-2">
          <CardHeader
            title="Threat Activity by Attack Vector"
            subtitle="Distribution of verified anomalous incidents across consortium telemetry"
            icon={ShieldAlert}
            iconTone="accent"
          />
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vectorChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272f" vertical={false} />
                <XAxis dataKey="name" stroke="#8b8b94" fontSize={12} tickLine={false} />
                <YAxis stroke="#8b8b94" fontSize={12} allowDecimals={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{
                    backgroundColor: '#18181d',
                    borderColor: '#27272f',
                    borderRadius: '10px',
                    color: '#f4f4f5',
                  }}
                />
                <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Severity Distribution Donut Chart (1 col) */}
        <Card className="p-5">
          <CardHeader
            title="Severity Distribution"
            subtitle="Incident impact breakdown"
            icon={TrendingUp}
            iconTone="ai"
          />
          <div className="mt-4 flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181d',
                    borderColor: '#27272f',
                    borderRadius: '10px',
                    color: '#f4f4f5',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-muted">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Threats Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-fg">Recent Anchored Threats</h3>
            <p className="text-xs text-muted">
              Latest cryptographic receipts submitted to Ethereum Sepolia
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigate('feed')}
            iconRight={ArrowUpRight}
          >
            View All ({threats.length})
          </Button>
        </div>

        <DataTable
          columns={columns}
          rows={recentThreats}
          rowKey="id"
          onRowClick={(row) => onInspectProof(row)}
        />
      </div>
    </div>
  );
}
