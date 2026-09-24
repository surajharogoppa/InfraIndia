import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { analyticsApi } from '../services/api';
import { formatCrore, formatPercent, sectorColor } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, LabelList
} from 'recharts';
import ExportButton from '../components/ExportButton';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '8px 12px',
      fontSize: '0.8rem',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const TABS = ['States', 'Sectors', 'Ministries', 'Costs'];

export default function Analytics() {
  const [tab, setTab] = useState('States');
  const { data: states } = useApi(() => analyticsApi.states());
  const { data: sectors } = useApi(() => analyticsApi.sectors());
  const { data: ministries } = useApi(() => analyticsApi.ministries());
  const { data: costs } = useApi(() => analyticsApi.costs());

  useEffect(() => { document.title = 'Analytics — GovProject Intelligence'; }, []);

  function StateTab() {
    const top = (states || []).slice(0, 15);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <div className="chart-card" id="analytics-state-chart">
          <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="chart-title">Top 15 States by Project Count</div>
              <div className="chart-subtitle">Number of ongoing infrastructure projects per State/UT</div>
            </div>
            <ExportButton targetId="analytics-state-chart" fileName="analytics_top_states" />
          </div>
          <ResponsiveContainer width="100%" height={440}>
            <BarChart data={top} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="state_name" width={140} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" fill="var(--accent)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="project_count" position="right" fill="var(--text-secondary)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <div className="charts-grid">
          <div className="chart-card" id="analytics-sector-pie">
            <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="chart-title">Projects by Sector Share</div>
                <div className="chart-subtitle">Top sectors vs others</div>
              </div>
              <ExportButton targetId="analytics-sector-pie" fileName="analytics_sector_share" />
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card" id="analytics-sector-bar">
            <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="chart-title">Total Cost by Sector (₹ Cr)</div>
                <div className="chart-subtitle">Cost across top 8 sectors</div>
              </div>
              <ExportButton targetId="analytics-sector-bar" fileName="analytics_sector_cost" />
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={(sectors || []).slice(0, 8)} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="sector_name" width={140} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="total_cost_crore" name="Cost (Cr)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="total_cost_crore" position="right" fill="var(--text-secondary)" fontSize={11} formatter={(v) => typeof v === 'number' ? v.toLocaleString('en-IN') : v} />
                  {(sectors || []).slice(0, 8).map((_, i) => <Cell key={i} fill={sectorColor(i)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
        <div className="chart-card" id="analytics-ministry-chart">
          <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="chart-title">Projects by Ministry (Top 10)</div>
              <div className="chart-subtitle">Count of projects overseen per Union Ministry</div>
            </div>
            <ExportButton targetId="analytics-ministry-chart" fileName="analytics_top_ministries" />
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={(ministries || []).slice(0, 10)} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="ministry_name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} width={220} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="project_count" name="Projects" fill="hsl(262 80% 65%)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="project_count" position="right" fill="var(--text-secondary)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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
            <div key={label} className="kpi-card">
              <div className="kpi-value">{value}</div>
              <div className="kpi-label">{label}</div>
              <div className="kpi-sub platform-derived-note" style={{ marginTop: 6 }}>Platform-derived</div>
            </div>
          ))}
        </div>
        <div className="chart-card" id="analytics-costs-chart">
          <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="chart-title">Cost Distribution</div>
              <div className="chart-subtitle">Distribution of central sector projects across cost brackets</div>
            </div>
            <ExportButton targetId="analytics-costs-chart" fileName="analytics_cost_distribution" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costs?.distribution || []} margin={{ bottom: 25, left: 10, right: 10, top: 10 }}>
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} height={35} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="count" name="Projects" fill="hsl(174 65% 48%)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" fill="var(--text-secondary)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
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
    </div>
  );
}
