import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { analyticsApi, refApi } from '../services/api';
import { formatCrore, formatNumber, formatPercent, sectorColor } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, LabelList
} from 'recharts';
import { FolderKanban, IndianRupee, TrendingUp, Activity, CheckCircle, HelpCircle, AlertCircle, Database, RefreshCw, Clock } from 'lucide-react';
import ExportButton from '../components/ExportButton';

import { Card, CardHeader } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Breadcrumbs from '../components/common/Breadcrumbs';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const p0 = payload[0];
  const title = label || p0?.name || p0?.payload?.sector_name || p0?.payload?.state_name || p0?.payload?.name;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '7px 11px',
      fontSize: '0.75rem',
      boxShadow: 'var(--shadow)',
      zIndex: 1000
    }}>
      {title && <div style={{ color: 'var(--text-primary)', marginBottom: 3, fontWeight: 700 }}>{title}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.payload?.fill || p.color || 'var(--text-secondary)', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name || 'Projects'}:</span>
          <strong>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data: overview } = useApi(() => analyticsApi.overview());
  const { data: sectors } = useApi(() => analyticsApi.sectors());
  const { data: states } = useApi(() => analyticsApi.states());
  const { data: progress } = useApi(() => analyticsApi.progress());
  const { data: costs } = useApi(() => analyticsApi.costs());
  const { data: years } = useApi(() => analyticsApi.years());
  const { data: sources } = useApi(() => refApi.sources());

  // Find PAIMANA source for freshness display
  const paimanaSource = sources?.results
    ? sources.results.find(s => s.name?.includes('PAIMANA') || s.name?.includes('Flash Report'))
    : sources?.find?.(s => s.name?.includes('PAIMANA') || s.name?.includes('Flash Report'));

  const lastSync = paimanaSource?.last_successful_sync
    ? new Date(paimanaSource.last_successful_sync)
    : null;

  const formatSyncTime = (dt) => {
    if (!dt) return 'Never';
    return dt.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    }) + ' IST';
  };

  useEffect(() => {
    document.title = 'Dashboard — InfraIndia';
  }, []);

  const progressData = progress ? [
    { name: '0–25%', value: progress['0_25'], fill: '#ef4444' },
    { name: '25–50%', value: progress['25_50'], fill: '#f97316' },
    { name: '50–75%', value: progress['50_75'], fill: '#f59e0b' },
    { name: '75–100%', value: progress['75_100'], fill: '#10b981' },
    { name: 'Completed', value: progress['completed'], fill: '#3b82f6' },
    { name: 'Unknown', value: progress['unknown'], fill: '#6b7280' },
  ] : [];

  const validProgress = progressData.filter(d => (d.value || 0) > 0);
  const totalProgress = validProgress.reduce((sum, d) => sum + (d.value || 0), 0);
  const validYears = (years || []).filter(y => y.year >= 2020 && y.year <= 2038);
  const topStates = (states || []).slice(0, 10);
  const topSectors = (sectors || []).slice(0, 8);

  return (
    <div className="page-body">
      <Breadcrumbs />
      {/* Compact Source Details & Freshness Header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: 'var(--radius)',
        padding: '6px 12px',
        marginBottom: 'var(--gap-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.74rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={13} color="var(--accent)" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Source:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>MoSPI / IPMD Central Sector Projects (&ge; ₹150 Cr)</span>
          </div>

          <div style={{ width: '1px', height: '12px', background: 'var(--border)' }} className="desktop-only" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RefreshCw size={12} color="var(--green)" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Synced:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatSyncTime(lastSync)}</span>
          </div>

          <div style={{ width: '1px', height: '12px', background: 'var(--border)' }} className="desktop-only" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} color="hsl(262 80% 65%)" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Cadence:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Monthly Flash Report</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={11} />
          <span>Independent Platform · Not an official government service</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: 'var(--gap-sm)' }}>
        <div>
          <div className="section-title" style={{ fontSize: '1.15rem' }}>Dashboard</div>
          <div className="section-subtitle" style={{ fontSize: '0.74rem' }}>Overview of government infrastructure projects</div>
        </div>
      </div>

      {/* KPI Cards: fit in one single line on desktop */}
      <div className="dashboard-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px', marginBottom: 'var(--gap)' }}>
        <StatCard
          icon={FolderKanban}
          title="Total Projects"
          value={formatNumber(overview?.total_projects)}
          description="Across all sectors"
          color="hsl(220 90% 60%)"
          bgColor="var(--bg-card)"
          loading={!overview}
        />
        <StatCard
          icon={IndianRupee}
          title="Total Cost"
          value={formatCrore(overview?.total_cost_crore)}
          description="Current/revised cost"
          color="hsl(42 95% 58%)"
          bgColor="var(--bg-card)"
          loading={!overview}
        />
        <StatCard
          icon={TrendingUp}
          title="Expenditure"
          value={formatCrore(overview?.total_expenditure_crore)}
          description="Cumulative spend"
          color="hsl(174 65% 48%)"
          bgColor="var(--bg-card)"
          loading={!overview}
        />
        <StatCard
          icon={Activity}
          title="Avg. Progress"
          value={formatPercent(overview?.avg_progress)}
          description="Platform-derived"
          color="hsl(262 80% 65%)"
          bgColor="var(--bg-card)"
          loading={!overview}
        />
        <StatCard
          icon={Activity}
          title="Active Projects"
          value={formatNumber(overview?.active_projects)}
          description="Platform-derived"
          color="hsl(142 70% 48%)"
          bgColor="var(--bg-card)"
          loading={!overview}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed"
          value={formatNumber(overview?.completed_projects)}
          description="Platform-derived"
          color="hsl(210 90% 60%)"
          bgColor="var(--bg-card)"
          loading={!overview}
        />
        <StatCard
          icon={HelpCircle}
          title="Unknown Status"
          value={formatNumber(overview?.unknown_projects)}
          description="Status not determined"
          color="hsl(220 12% 65%)"
          bgColor="var(--bg-card)"
          loading={!overview}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid" style={{ gap: '10px', marginBottom: 'var(--gap)' }}>
        {/* Projects by Sector */}
        <Card id="dashboard-sector-chart" style={{ padding: '8px 12px' }}>
          <CardHeader 
            title="Projects by Sector" 
            subtitle="Count and total cost"
            action={<ExportButton targetId="dashboard-sector-chart" fileName="dashboard_sector_projects" />}
          />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topSectors} layout="vertical" margin={{ left: 10, right: 35, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="sector_name" width={130} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="project_count" position="right" fill="var(--text-secondary)" fontSize={10} />
                {topSectors.map((_, i) => (
                  <Cell key={i} fill={sectorColor(i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Progress Distribution */}
        <Card id="dashboard-progress-chart" style={{ padding: '8px 12px' }}>
          <CardHeader 
            title="Progress Distribution"
            subtitle={<span className="platform-derived-note" style={{ fontSize: '0.65rem' }}>Platform-derived indicator</span>}
            action={<ExportButton targetId="dashboard-progress-chart" fileName="dashboard_progress" />}
          />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={validProgress}
                cx="50%"
                cy="44%"
                innerRadius={38}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
              >
                {validProgress.map(entry => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value, entry) => {
                  const val = entry?.payload?.value || 0;
                  const pct = totalProgress > 0 ? ((val / totalProgress) * 100).toFixed(0) : 0;
                  return <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{value} ({pct}%)</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid" style={{ gap: '10px', marginBottom: 'var(--gap)' }}>
        {/* Projects by State */}
        <Card id="dashboard-state-chart" style={{ padding: '8px 12px' }}>
          <CardHeader 
            title="Top States by Project Count" 
            subtitle="Number of projects per state"
            action={<ExportButton targetId="dashboard-state-chart" fileName="dashboard_top_states" />}
          />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topStates} layout="vertical" margin={{ left: 10, right: 40, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="state_name" width={130} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="project_count" position="right" fill="var(--text-secondary)" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Cost Distribution */}
        <Card id="dashboard-cost-chart" style={{ padding: '8px 12px' }}>
          <CardHeader 
            title="Cost Distribution" 
            subtitle="Projects by cost range"
            action={<ExportButton targetId="dashboard-cost-chart" fileName="dashboard_cost_distribution" />}
          />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costs?.distribution || []} margin={{ bottom: 20, left: 10, right: 15, top: 16 }}>
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 9.5 }} axisLine={false} tickLine={false} interval={0} height={30} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="count" name="Projects" fill="hsl(262 80% 65%)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" fill="var(--text-secondary)" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Projects by Completion Year */}
      <Card id="dashboard-year-chart" style={{ padding: '8px 12px' }}>
        <CardHeader 
          title="Projects by Reported Completion Year" 
          subtitle="Based on current/revised completion date field from official MoSPI data"
          action={<ExportButton targetId="dashboard-year-chart" fileName="dashboard_completion_years" />}
        />
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={validYears} margin={{ top: 16, right: 24, left: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="project_count"
              name="Projects"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--accent)', r: 3 }}
              activeDot={{ r: 5 }}
            >
              <LabelList dataKey="project_count" position="top" fill="var(--text-secondary)" fontSize={10} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
