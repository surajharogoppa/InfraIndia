import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, refApi } from '../services/api';
import {
  formatCrore, formatDate, formatPercent, statusBadgeClass,
  statusLabel, progressClass
} from '../utils/format';
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

function ProgressCell({ value }) {
  if (value == null) return <span className="text-muted">—</span>;
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${progressClass(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="progress-value">{value}%</span>
    </div>
  );
}

const SORT_FIELDS = {
  name: 'name',
  current_cost_crore: 'current_cost',
  current_progress: 'current_progress',
  current_completion_date: 'current_completion_date',
  updated_at: 'updated_at',
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');

  // Filters
  const [states, setStates] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [filters, setFilters] = useState({
    state: '', sector: '', ministry: '', platform_status: '',
    min_cost: '', max_cost: '', progress_min: '', progress_max: '',
  });

  // Load filter options
  useEffect(() => {
    refApi.states().then(r => setStates(r.data?.results || r.data));
    refApi.sectors().then(r => setSectors(r.data?.results || r.data));
    refApi.ministries().then(r => setMinistries(r.data?.results || r.data));
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ordering: `${sortDir === 'desc' ? '-' : ''}${SORT_FIELDS[sortField] || sortField}`,
        search: search || undefined,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
      };
      const res = await projectsApi.list(params);
      setProjects(res.data.results || res.data);
      setCount(res.data.count || 0);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortField, sortDir, filters]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    document.title = 'Project Explorer — GovProject Intelligence';
  }, []);

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <span style={{ opacity: 0.2 }}>↕</span>;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="page-body">
      {/* Header */}
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Project Explorer</div>
          <div className="section-subtitle">{count.toLocaleString()} projects found</div>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ flex: '1', minWidth: 240 }}>
          <Search className="search-input-icon" size={16} />
          <input
            className="search-input"
            type="text"
            placeholder="Search by name, ID, ministry, contractor..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="select-input"
          value={filters.state}
          onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(1); }}
        >
          <option value="">All States</option>
          {(Array.isArray(states) ? states : []).map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select
          className="select-input"
          value={filters.sector}
          onChange={e => { setFilters(f => ({ ...f, sector: e.target.value })); setPage(1); }}
        >
          <option value="">All Sectors</option>
          {(Array.isArray(sectors) ? sectors : []).map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select
          className="select-input"
          value={filters.platform_status}
          onChange={e => { setFilters(f => ({ ...f, platform_status: e.target.value })); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="PLANNED">Planned</option>
          <option value="UNKNOWN">Unknown</option>
        </select>

        <input
          className="select-input"
          type="number"
          placeholder="Min cost (Cr)"
          style={{ width: 120 }}
          value={filters.min_cost}
          onChange={e => { setFilters(f => ({ ...f, min_cost: e.target.value })); setPage(1); }}
        />
        <input
          className="select-input"
          type="number"
          placeholder="Max cost (Cr)"
          style={{ width: 120 }}
          value={filters.max_cost}
          onChange={e => { setFilters(f => ({ ...f, max_cost: e.target.value })); setPage(1); }}
        />

        <input
          className="select-input"
          type="number"
          placeholder="Min progress %"
          style={{ width: 120 }}
          value={filters.progress_min}
          onChange={e => { setFilters(f => ({ ...f, progress_min: e.target.value })); setPage(1); }}
        />

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setFilters({ state: '', sector: '', ministry: '', platform_status: '', min_cost: '', max_cost: '', progress_min: '', progress_max: '' }); setSearch(''); setPage(1); }}
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ minWidth: 200 }}>
                Project Name <SortIcon field="name" />
              </th>
              <th>State</th>
              <th>Sector</th>
              <th onClick={() => handleSort('current_cost_crore')}>
                Cost <SortIcon field="current_cost_crore" />
              </th>
              <th onClick={() => handleSort('current_progress')} style={{ minWidth: 140 }}>
                Progress <SortIcon field="current_progress" />
              </th>
              <th>Status</th>
              <th onClick={() => handleSort('current_completion_date')}>
                Completion <SortIcon field="current_completion_date" />
              </th>
              <th>Source Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="skeleton skeleton-text" style={{ width: '80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">No projects found</div>
                    <div className="empty-sub">Try adjusting your filters or search terms</div>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map(p => (
                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {p.name}
                    </div>
                    {p.organization_name && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {p.organization_name}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{p.state_name || '—'}</div>
                    {p.district_name && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.district_name}</div>
                    )}
                  </td>
                  <td>
                    {p.sector_name ? (
                      <span className="badge badge-sector">{p.sector_name}</span>
                    ) : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCrore(p.current_cost_crore)}</td>
                  <td><ProgressCell value={p.current_progress} /></td>
                  <td>
                    <span className={`badge ${statusBadgeClass(p.platform_status)}`}>
                      {statusLabel(p.platform_status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {p.current_completion_date
                      ? new Date(p.current_completion_date).getFullYear()
                      : '—'
                    }
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.source_status || '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}
                    >
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span>
              {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, count)} of {count.toLocaleString()}
            </span>
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
              return (
                <button
                  key={pageNum}
                  className={`page-btn${pageNum === page ? ' active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
