import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { analyticsApi } from '../services/api';
import { formatCrore, formatPercent, sectorColor } from '../utils/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';

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
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Projects by State</div>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={top} layout="vertical" margin={{ left: 110 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="state_name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220 16% 18%)' }} />
              <Bar dataKey="project_count" name="Projects" fill="var(--accent)" radius={[0, 4, 4, 0]} />
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-title">Projects by Sector</div></div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sectors || []} dataKey="project_count" nameKey="sector_name" cx="50%" cy="50%" outerRadius={100} paddingAngle={3}>
                  {(sectors || []).map((_, i) => <Cell key={i} fill={sectorColor(i)} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-title">Total Cost by Sector (₹ Cr)</div></div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(sectors || []).slice(0, 8)} layout="vertical" margin={{ left: 90 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="sector_name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220 16% 18%)' }} />
                <Bar dataKey="total_cost_crore" name="Cost (Cr)" radius={[0, 4, 4, 0]}>
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
                  <td>{s.project_count}</td>
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
        <div className="chart-card">
          <div className="chart-card-header"><div className="chart-title">Projects by Ministry</div></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(ministries || []).slice(0, 10)} layout="vertical" margin={{ left: 200 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="ministry_name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={190} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220 16% 18%)' }} />
              <Bar dataKey="project_count" name="Projects" fill="hsl(262 80% 65%)" radius={[0, 4, 4, 0]} />
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
                  <td>{m.project_count}</td>
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
        <div className="chart-card">
          <div className="chart-card-header"><div className="chart-title">Cost Distribution</div></div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costs?.distribution || []}>
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220 16% 18%)' }} />
              <Bar dataKey="count" name="Projects" fill="hsl(174 65% 48%)" radius={[4, 4, 0, 0]} />
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
