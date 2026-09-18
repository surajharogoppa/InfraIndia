import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { analyticsApi, refApi } from '../services/api';
import { formatCrore, formatNumber, formatPercent, sectorColor } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { FolderKanban, IndianRupee, TrendingUp, Activity, CheckCircle, HelpCircle, AlertCircle, Database, RefreshCw, Clock } from 'lucide-react';

function KPICard({ icon: Icon, label, value, sub, color, bgColor }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color, '--kpi-bg': bgColor }}>
      <div className="kpi-icon">
        <Icon size={18} />
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: '0.8rem'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)' }}>
          {p.name}: <strong>{p.value?.toLocaleString?.() ?? p.value}</strong>
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
  const { data: latestRun } = useApi(() => refApi.ingestionRuns({ page_size: 1 }));

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
    document.title = 'Dashboard — GovProject Intelligence';
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
  const validYears = (years || []).filter(y => y.year >= 2020 && y.year <= 2038);
  const topStates = (states || []).slice(0, 10);
  const topSectors = (sectors || []).slice(0, 8);

  return (
    <div className="page-body">
      {/* Disclaimer */}
      <div className="disclaimer-banner">
        <AlertCircle size={14} />
        <span>
          <strong>Independent Platform.</strong> All data sourced from publicly available official government sources.
          Platform-derived indicators are clearly labelled. Not an official government service.
        </span>
      </div>

      {/* Data Freshness Banner */}
      <div className="data-freshness-banner">
        <div className="freshness-items-group">
          <div className="freshness-item">
            <div className="freshness-item-icon">
              <Database size={16} />
            </div>
            <div className="freshness-item-content">
              <span className="freshness-item-label">Source Dataset</span>
              <span className="freshness-item-value">MoSPI / IPMD — Central Sector Projects (≥ ₹150 Cr)</span>
            </div>
          </div>

          <div className="freshness-divider" />

          <div className="freshness-item">
            <div className="freshness-item-icon" style={{ color: 'var(--green)' }}>
              <RefreshCw size={15} />
            </div>
            <div className="freshness-item-content">
              <span className="freshness-item-label">Last Synchronized</span>
              <span className="freshness-item-value">{formatSyncTime(lastSync)}</span>
            </div>
          </div>

          <div className="freshness-divider" />

          <div className="freshness-item">
            <div className="freshness-item-icon" style={{ color: 'hsl(262 80% 65%)' }}>
              <Clock size={15} />
            </div>
            <div className="freshness-item-content">
              <span className="freshness-item-label">Source Cadence</span>
              <span className="freshness-item-value">Monthly Official Release</span>
            </div>
          </div>
        </div>

        <div className="freshness-tag-notice">
          <AlertCircle size={13} />
          <span>Automated monthly synchronization — not real-time</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Dashboard</div>
          <div className="section-subtitle">Overview of government infrastructure projects</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid mb-lg">
        <KPICard
          icon={FolderKanban}
          label="Total Projects"
          value={formatNumber(overview?.total_projects)}
          sub="Across all sectors"
          color="hsl(220 90% 60%)"
          bgColor="hsl(220 90% 60% / 0.12)"
        />
        <KPICard
          icon={IndianRupee}
          label="Total Project Cost"
          value={formatCrore(overview?.total_cost_crore)}
          sub="Current/revised cost"
          color="hsl(42 95% 58%)"
          bgColor="hsl(42 95% 58% / 0.12)"
        />
        <KPICard
          icon={TrendingUp}
          label="Total Expenditure"
          value={formatCrore(overview?.total_expenditure_crore)}
          sub="Cumulative spend"
          color="hsl(174 65% 48%)"
          bgColor="hsl(174 65% 48% / 0.12)"
        />
        <KPICard
          icon={Activity}
          label="Avg. Progress"
          value={formatPercent(overview?.avg_progress)}
          sub={<><span className="platform-derived-note">Platform-derived indicator</span></>}
          color="hsl(262 80% 65%)"
          bgColor="hsl(262 80% 65% / 0.12)"
        />
        <KPICard
          icon={Activity}
          label="Active Projects"
          value={formatNumber(overview?.active_projects)}
          sub={<><span className="platform-derived-note">Platform-derived</span></>}
          color="hsl(142 70% 48%)"
          bgColor="hsl(142 70% 48% / 0.12)"
        />
        <KPICard
          icon={CheckCircle}
          label="Completed"
          value={formatNumber(overview?.completed_projects)}
          sub={<><span className="platform-derived-note">Platform-derived</span></>}
          color="hsl(210 90% 60%)"
          bgColor="hsl(210 90% 60% / 0.12)"
        />
        <KPICard
          icon={HelpCircle}
          label="Unknown Status"
          value={formatNumber(overview?.unknown_projects)}
          sub="Status not determined"
          color="hsl(220 12% 65%)"
          bgColor="hsl(220 12% 65% / 0.12)"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid mb-lg">
        {/* Projects by Sector */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Projects by Sector</div>
              <div className="chart-subtitle">Count and total cost</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSectors} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="sector_name" width={140} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" radius={[0, 4, 4, 0]}>
                {topSectors.map((_, i) => (
                  <Cell key={i} fill={sectorColor(i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Progress Distribution</div>
              <div className="chart-subtitle">
                <span className="platform-derived-note">Platform-derived indicator</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={validProgress}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
              >
                {validProgress.map(entry => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid mb-lg">
        {/* Projects by State */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Top States by Project Count</div>
              <div className="chart-subtitle">Number of projects per state</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topStates} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="state_name" width={130} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" fill="var(--accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Cost Distribution</div>
              <div className="chart-subtitle">Projects by cost range</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costs?.distribution || []} margin={{ bottom: 25, left: 10, right: 10, top: 10 }}>
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} height={35} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="count" name="Projects" fill="hsl(262 80% 65%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projects by Completion Year */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="chart-title">Projects by Reported Completion Year</div>
            <div className="chart-subtitle">Based on current/revised completion date field from official MoSPI data</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={validYears} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="project_count"
              name="Projects"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--accent)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
