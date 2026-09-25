import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { analyticsApi } from '../services/api';
import { formatCrore, formatPercent, sectorColor } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, LabelList
} from 'recharts';
import ExportButton from '../components/ExportButton';
import { Card, CardHeader } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Breadcrumbs from '../components/common/Breadcrumbs';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const p0 = payload[0];
  const title = label || p0?.name || p0?.payload?.sector_name || p0?.payload?.state_name || p0?.payload?.ministry_name || p0?.payload?.name;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '8px 12px',
      fontSize: '0.8rem',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow)',
      zIndex: 1000
    }}>
      {title && <div style={{ color: 'var(--text-primary)', marginBottom: 4, fontWeight: 700 }}>{title}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.payload?.fill || p.color || 'var(--text-secondary)', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}:</span>
          <strong>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const TABS = ['States', 'Sectors', 'Ministries', 'Costs', 'Progress'];

export default function Analytics() {
  const [tab, setTab] = useState('States');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: states } = useApi(() => analyticsApi.states());
  const { data: sectors } = useApi(() => analyticsApi.sectors());
  const { data: ministries } = useApi(() => analyticsApi.ministries());
  const { data: costs } = useApi(() => analyticsApi.costs());
  const { data: progress } = useApi(() => analyticsApi.progress());
  const { data: years } = useApi(() => analyticsApi.years());

  useEffect(() => { document.title = 'Analytics — InfraIndia'; }, []);

  function StateTab() {
    const top = (states || []).slice(0, 15);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <Card id="analytics-state-chart" style={{ padding: 'var(--gap)' }}>
          <CardHeader 
            title="Top 15 States by Project Count" 
            subtitle="Number of ongoing infrastructure projects per State/UT"
            action={<ExportButton targetId="analytics-state-chart" fileName="analytics_top_states" />}
          />
          <ResponsiveContainer width="100%" height={isMobile ? 380 : 420}>
            <BarChart data={top} layout="vertical" margin={{ left: isMobile ? 0 : 10, right: isMobile ? 35 : 45, top: 10, bottom: 10 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="state_name"
                width={isMobile ? 100 : 150}
                tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 9 : 10.5 }}
                tickFormatter={(v) => isMobile && v?.length > 13 ? v.slice(0, 12) + '…' : v}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="project_count" position="right" fill="var(--text-secondary)" fontSize={isMobile ? 9.5 : 11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <div className="table-container">
          <div className="table-header"><div className="table-title">State Summary</div></div>
          <table>
            <thead>
              <tr>
                <th>State</th>
                <th>Projects</th>
                <th>Total Cost (Cr)</th>
                <th>Total Expenditure (Cr)</th>
                <th>Avg Progress</th>
              </tr>
            </thead>
            <tbody>
              {(states || []).map(s => (
                <tr key={s.state_id}>
                  <td style={{ fontWeight: 600 }}>{s.state_name}</td>
                  <td>{s.project_count.toLocaleString()}</td>
                  <td>{formatCrore(s.total_cost_crore)}</td>
                  <td>{formatCrore(s.total_expenditure_crore)}</td>
                  <td>{formatPercent(s.avg_progress)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function SectorTab() {
    const topSectors = (sectors || []).slice(0, 6);
    const otherCount = (sectors || []).slice(6).reduce((acc, s) => acc + (s.project_count || 0), 0);
    const pieData = [
      ...topSectors.map((s, idx) => ({ name: s.sector_name, value: s.project_count, fill: sectorColor(idx) })),
      ...(otherCount > 0 ? [{ name: 'Other Sectors', value: otherCount, fill: 'hsl(220 12% 50%)' }] : [])
    ];
    const totalSectorProjects = pieData.reduce((acc, d) => acc + (d.value || 0), 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <div className="charts-grid">
          <Card id="analytics-sector-pie" style={{ padding: 'var(--gap)' }}>
            <CardHeader 
              title="Projects by Sector Share" 
              subtitle="Top sectors vs others"
              action={<ExportButton targetId="analytics-sector-pie" fileName="analytics_sector_share" />}
            />
            <ResponsiveContainer width="100%" height={isMobile ? 240 : 260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={isMobile ? 36 : 48}
                  outerRadius={isMobile ? 68 : 78}
                  paddingAngle={3}
                >
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v, entry) => {
                  const val = entry?.payload?.value || 0;
                  const pct = totalSectorProjects > 0 ? ((val / totalSectorProjects) * 100).toFixed(0) : 0;
                  return <span style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.68rem' : '0.74rem' }}>{v} ({pct}%)</span>;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card id="analytics-sector-bar" style={{ padding: 'var(--gap)' }}>
            <CardHeader 
              title="Total Cost by Sector (₹ Cr)" 
              subtitle="Cost across top 8 sectors"
              action={<ExportButton targetId="analytics-sector-bar" fileName="analytics_sector_cost" />}
            />
            <ResponsiveContainer width="100%" height={isMobile ? 260 : 280}>
              <BarChart data={(sectors || []).slice(0, 8)} layout="vertical" margin={{ left: isMobile ? 0 : 10, right: isMobile ? 55 : 65, top: 10, bottom: 10 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="sector_name"
                  width={isMobile ? 95 : 140}
                  tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 9 : 11 }}
                  tickFormatter={(v) => isMobile && v?.length > 12 ? v.slice(0, 11) + '…' : v}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="total_cost_crore" name="Cost (Cr)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="total_cost_crore" position="right" fill="var(--text-secondary)" fontSize={isMobile ? 9.5 : 11} formatter={(v) => typeof v === 'number' ? `₹${Math.round(v).toLocaleString('en-IN')}` : v} />
                  {(sectors || []).slice(0, 8).map((_, i) => <Cell key={i} fill={sectorColor(i)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <div className="table-container">
          <div className="table-header"><div className="table-title">Sector Summary</div></div>
          <table>
            <thead>
              <tr><th>Sector</th><th>Projects</th><th>Total Cost (Cr)</th><th>Expenditure (Cr)</th><th>Avg Progress</th></tr>
            </thead>
            <tbody>
              {(sectors || []).map(s => (
                <tr key={s.sector_id}>
                  <td style={{ fontWeight: 600 }}>{s.sector_name}</td>
                  <td>{s.project_count?.toLocaleString()}</td>
                  <td>{formatCrore(s.total_cost_crore)}</td>
                  <td>{formatCrore(s.total_expenditure_crore)}</td>
                  <td>{formatPercent(s.avg_progress)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function MinistriesTab() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <Card id="analytics-ministry-chart" style={{ padding: 'var(--gap)' }}>
          <CardHeader 
            title="Projects by Ministry (Top 10)" 
            subtitle="Count of projects overseen per Union Ministry"
            action={<ExportButton targetId="analytics-ministry-chart" fileName="analytics_top_ministries" />}
          />
          <ResponsiveContainer width="100%" height={isMobile ? 320 : 360}>
            <BarChart data={(ministries || []).slice(0, 10)} layout="vertical" margin={{ left: isMobile ? 0 : 10, right: isMobile ? 35 : 45, top: 10, bottom: 10 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="ministry_name"
                tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 8.5 : 10 }}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 110 : 220}
                interval={0}
                tickFormatter={(v) => isMobile ? (v?.length > 15 ? v.slice(0, 14) + '…' : v) : (v?.length > 28 ? v.slice(0, 26) + '…' : v)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" fill="hsl(262 80% 65%)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="project_count" position="right" fill="var(--text-secondary)" fontSize={isMobile ? 9.5 : 11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <div className="table-container">
          <div className="table-header"><div className="table-title">Ministry Summary</div></div>
          <table>
            <thead>
              <tr><th>Ministry</th><th>Projects</th><th>Total Cost (Cr)</th><th>Expenditure (Cr)</th><th>Avg Progress</th></tr>
            </thead>
            <tbody>
              {(ministries || []).map(m => (
                <tr key={m.ministry_id}>
                  <td style={{ fontWeight: 600 }}>{m.ministry_name}</td>
                  <td>{m.project_count?.toLocaleString()}</td>
                  <td>{formatCrore(m.total_cost_crore)}</td>
                  <td>{formatCrore(m.total_expenditure_crore)}</td>
                  <td>{formatPercent(m.avg_progress)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function CostsTab() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <div className="kpi-grid">
          {[
            { label: 'Average Cost', value: formatCrore(costs?.avg_cost_crore) },
            { label: 'Minimum Cost', value: formatCrore(costs?.min_cost_crore) },
            { label: 'Maximum Cost', value: formatCrore(costs?.max_cost_crore) },
          ].map(({ label, value }) => (
            <StatCard 
              key={label}
              title={label}
              value={value}
              description="Platform-derived"
              bgColor="var(--bg-card)"
            />
          ))}
        </div>
        <Card id="analytics-costs-chart" style={{ padding: 'var(--gap)' }}>
          <CardHeader 
            title="Cost Distribution" 
            subtitle="Distribution of central sector projects across cost brackets"
            action={<ExportButton targetId="analytics-costs-chart" fileName="analytics_cost_distribution" />}
          />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={costs?.distribution || []} margin={{ bottom: isMobile ? 35 : 25, left: 0, right: 15, top: 20 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: isMobile ? 9 : 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={isMobile ? -20 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 45 : 35}
              />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={isMobile ? 25 : 40} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="count" name="Projects" fill="hsl(174 65% 48%)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" fill="var(--text-secondary)" fontSize={isMobile ? 9.5 : 11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  }

  function ProgressTab() {
    const progressData = progress ? [
      { name: '0–25%', count: progress['0_25'] || 0, fill: '#ef4444' },
      { name: '25–50%', count: progress['25_50'] || 0, fill: '#f97316' },
      { name: '50–75%', count: progress['50_75'] || 0, fill: '#f59e0b' },
      { name: '75–100%', count: progress['75_100'] || 0, fill: '#10b981' },
      { name: 'Completed', count: progress['completed'] || 0, fill: '#3b82f6' },
    ] : [];

    const validYears = (years || []).filter(y => y.year >= 2020 && y.year <= 2038);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <Card id="analytics-progress-chart" style={{ padding: 'var(--gap)' }}>
          <CardHeader 
            title="Physical Progress Distribution" 
            subtitle="Breakdown of ongoing projects by reported completion stages"
            action={<ExportButton targetId="analytics-progress-chart" fileName="analytics_progress_distribution" />}
          />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={progressData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="count" name="Projects" radius={[4, 4, 0, 0]}>
                {progressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="count" position="top" fill="var(--text-secondary)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {validYears.length > 0 && (
          <Card id="analytics-completion-years-chart" style={{ padding: 'var(--gap)' }}>
            <CardHeader 
              title="Target Completion Timeline (by Year)" 
              subtitle="Scheduled delivery volume of central sector projects across target completion years"
              action={<ExportButton targetId="analytics-completion-years-chart" fileName="analytics_target_completion_years" />}
            />
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={validYears} margin={{ top: 20, right: 15, left: 10, bottom: 10 }}>
                <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="project_count" name="Projects Scheduled" fill="var(--accent)" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="project_count" position="top" fill="var(--text-secondary)" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="page-body">
      <Breadcrumbs />
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Analytics</div>
          <div className="section-subtitle">Aggregated statistics across states, sectors, and ministries</div>
        </div>
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'States' && <StateTab />}
      {tab === 'Sectors' && <SectorTab />}
      {tab === 'Ministries' && <MinistriesTab />}
      {tab === 'Costs' && <CostsTab />}
      {tab === 'Progress' && <ProgressTab />}
    </div>
  );
}
