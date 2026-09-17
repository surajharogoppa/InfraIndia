import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { formatCroreExact, formatPercent, formatDateShort, statusBadgeClass, statusLabel } from '../utils/format';
import { Search, X, GitCompare } from 'lucide-react';

export default function Compare() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [comparing, setComparing] = useState(false);

  useEffect(() => { document.title = 'Compare Projects — GovProject Intelligence'; }, []);

  useEffect(() => {
    if (!search) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await projectsApi.list({ search, page_size: 6 });
      setSearchResults(res.data.results || res.data);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function addProject(p) {
    if (selected.length >= 5) return;
    if (selected.find(s => s.id === p.id)) return;
    setSelected(s => [...s, p]);
    setSearch('');
    setSearchResults([]);
    setResults(null);
  }

  function removeProject(id) {
    setSelected(s => s.filter(p => p.id !== id));
    setResults(null);
  }

  async function compare() {
    if (selected.length < 2) return;
    setComparing(true);
    try {
      const res = await projectsApi.compare(selected.map(p => p.id));
      setResults(res.data);
    } finally {
      setComparing(false);
    }
  }

  const ROWS = [
    { label: 'State', key: 'state_name' },
    { label: 'Sector', key: 'sector_name' },
    { label: 'Ministry', key: 'ministry_name' },
    { label: 'Original Cost', key: 'original_cost_crore', format: formatCroreExact },
    { label: 'Current Cost', key: 'current_cost_crore', format: formatCroreExact },
    { label: 'Expenditure', key: 'current_expenditure_crore', format: formatCroreExact },
    { label: 'Progress', key: 'current_progress', format: v => v != null ? `${v}%` : '—' },
    { label: 'Source Status', key: 'source_status' },
    { label: 'Platform Status', key: 'platform_status', format: statusLabel },
    { label: 'Original Start', key: 'original_start_date', format: formatDateShort },
    { label: 'Original Completion', key: 'original_completion_date', format: formatDateShort },
    { label: 'Current Completion', key: 'current_completion_date', format: formatDateShort },
    { label: 'Cost Change %', key: 'platform_cost_change_pct', format: v => v != null ? `${v > 0 ? '+' : ''}${v}% ⚠ Platform-derived` : '—' },
    { label: 'Schedule Delay', key: 'platform_schedule_delay_months', format: v => v != null ? `${v > 0 ? '+' : ''}${v} months ⚠ Platform-derived` : '—' },
    { label: 'Contractor', key: 'contractor_name' },
  ];

  return (
    <div className="page-body">
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Compare Projects</div>
          <div className="section-subtitle">Select 2–5 projects to compare side by side</div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="card mb-lg">
        <div className="card-title"><GitCompare size={16} /> Select Projects</div>

        {/* Selected chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-sm)', marginBottom: 'var(--gap-sm)' }}>
          {selected.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-hover)', border: '1px solid var(--accent)',
              borderRadius: 'var(--radius)', padding: '4px 10px', fontSize: '0.82rem'
            }}>
              <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{p.name}</span>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
                onClick={() => removeProject(p.id)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {selected.length < 5 && (
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <div className="search-input-wrap">
                <Search className="search-input-icon" size={14} />
                <input
                  className="search-input"
                  placeholder="Search and add project..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                  marginTop: 4, overflow: 'hidden'
                }}>
                  {searchResults.map(p => (
                    <div
                      key={p.id}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem',
                        borderBottom: '1px solid var(--border)'
                      }}
                      onMouseDown={() => addProject(p)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {p.state_name} · {p.sector_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={selected.length < 2 || comparing}
          onClick={compare}
        >
          <GitCompare size={14} />
          {comparing ? 'Comparing...' : 'Compare Selected Projects'}
        </button>
      </div>

      {/* Comparison Table */}
      {results && (
        <div className="table-container">
          <div className="table-header">
            <div className="table-title">Comparison Results</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Raw source data presented. No ranking or "best project" score is generated.
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  {results.map(p => (
                    <th key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(({ label, key, format }) => (
                  <tr key={key}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {label}
                    </td>
                    {results.map(p => (
                      <td key={p.id}>
                        {format ? format(p[key]) : (p[key] || '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
