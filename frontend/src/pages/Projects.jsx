import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projectsApi, refApi } from '../services/api';
import {
  formatCrore, formatPercent, statusBadgeClass,
  statusLabel, progressClass
} from '../utils/format';
import {
  Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ExternalLink, X, Check, RotateCcw
} from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';

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

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span style={{ opacity: 0.2 }}>↕</span>;
  return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortField, setSortField] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters
  const [states, setStates] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [filters, setFilters] = useState({
    state: searchParams.get('state') || '',
    sector: searchParams.get('sector') || '',
    ministry: searchParams.get('ministry') || '',
    platform_status: searchParams.get('platform_status') || '',
    min_cost: searchParams.get('min_cost') || '',
    max_cost: searchParams.get('max_cost') || '',
    progress_min: searchParams.get('progress_min') || '',
    progress_max: searchParams.get('progress_max') || '',
  });

  // Calculate active filters count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== '').length + (search ? 1 : 0);
  }, [filters, search]);

  // Load reference data
  useEffect(() => {
    refApi.states().then(r => setStates(r.data?.results || r.data));
    refApi.sectors().then(r => setSectors(r.data?.results || r.data));
    refApi.ministries().then(r => setMinistries(r.data?.results || r.data));
  }, []);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page);
    if (search) params.set('search', search);
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params, { replace: true });
  }, [page, search, filters, setSearchParams]);

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
    document.title = 'Project Explorer — InfraIndia';
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

  function clearAllFilters() {
    setFilters({
      state: '', sector: '', ministry: '', platform_status: '',
      min_cost: '', max_cost: '', progress_min: '', progress_max: ''
    });
    setSearch('');
    setPage(1);
    setMobileFilterOpen(false);
  }

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="page-body">
      <Breadcrumbs />
      {/* Header */}
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Project Explorer</div>
          <div className="section-subtitle">{count.toLocaleString()} central sector projects tracked</div>
        </div>
      </div>

      {/* Desktop Search & Filters Toolbar */}
      <div className="filter-bar desktop-only" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--gap)', alignItems: 'center' }}>
        <div className="search-input-wrap" style={{ flex: '1 1 240px' }}>
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
          style={{ width: 110 }}
          value={filters.min_cost}
          onChange={e => { setFilters(f => ({ ...f, min_cost: e.target.value })); setPage(1); }}
        />
        <input
          className="select-input"
          type="number"
          placeholder="Max cost (Cr)"
          style={{ width: 110 }}
          value={filters.max_cost}
          onChange={e => { setFilters(f => ({ ...f, max_cost: e.target.value })); setPage(1); }}
        />

        <input
          className="select-input"
          type="number"
          placeholder="Min prog %"
          style={{ width: 100 }}
          value={filters.progress_min}
          onChange={e => { setFilters(f => ({ ...f, progress_min: e.target.value })); setPage(1); }}
        />

        {activeFilterCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearAllFilters}>
            Clear
          </button>
        )}
      </div>

      {/* Mobile Search & Filter Button */}
      <div className="mobile-only" style={{ display: 'flex', gap: '8px', marginBottom: 'var(--gap)' }}>
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <Search className="search-input-icon" size={16} />
          <input
            className="search-input"
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button
          className={`btn ${activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setMobileFilterOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          <Filter size={15} />
          <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
        </button>
      </div>

      {/* Mobile Filter Drawer Modal */}
      {mobileFilterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            flexDirection: 'column'
          }}
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderTopLeftRadius: 'var(--radius)',
              borderTopRightRadius: 'var(--radius)',
              padding: 'var(--gap-lg)',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--gap-md)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={16} /> Filter Projects
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setMobileFilterOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>State</label>
                <select
                  className="select-input"
                  style={{ width: '100%', marginTop: 4 }}
                  value={filters.state}
                  onChange={e => { setFilters(f => ({ ...f, state: e.target.value })); setPage(1); }}
                >
                  <option value="">All States</option>
                  {(Array.isArray(states) ? states : []).map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sector</label>
                <select
                  className="select-input"
                  style={{ width: '100%', marginTop: 4 }}
                  value={filters.sector}
                  onChange={e => { setFilters(f => ({ ...f, sector: e.target.value })); setPage(1); }}
                >
                  <option value="">All Sectors</option>
                  {(Array.isArray(sectors) ? sectors : []).map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
                <select
                  className="select-input"
                  style={{ width: '100%', marginTop: 4 }}
                  value={filters.platform_status}
                  onChange={e => { setFilters(f => ({ ...f, platform_status: e.target.value })); setPage(1); }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PLANNED">Planned</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Min Cost (Cr)</label>
                  <input
                    className="select-input"
                    type="number"
                    style={{ width: '100%', marginTop: 4 }}
                    value={filters.min_cost}
                    onChange={e => { setFilters(f => ({ ...f, min_cost: e.target.value })); setPage(1); }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Max Cost (Cr)</label>
                  <input
                    className="select-input"
                    type="number"
                    style={{ width: '100%', marginTop: 4 }}
                    value={filters.max_cost}
                    onChange={e => { setFilters(f => ({ ...f, max_cost: e.target.value })); setPage(1); }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Min Progress %</label>
                <input
                  className="select-input"
                  type="number"
                  style={{ width: '100%', marginTop: 4 }}
                  value={filters.progress_min}
                  onChange={e => { setFilters(f => ({ ...f, progress_min: e.target.value })); setPage(1); }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={clearAllFilters}
                >
                  Clear All
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => setMobileFilterOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ minWidth: 200, cursor: 'pointer' }}>
                Project Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
              </th>
              <th>State</th>
              <th>Sector</th>
              <th onClick={() => handleSort('current_cost_crore')} style={{ cursor: 'pointer' }}>
                Cost <SortIcon field="current_cost_crore" sortField={sortField} sortDir={sortDir} />
              </th>
              <th onClick={() => handleSort('current_progress')} style={{ minWidth: 140, cursor: 'pointer' }}>
                Progress <SortIcon field="current_progress" sortField={sortField} sortDir={sortDir} />
              </th>
              <th>Status</th>
              <th onClick={() => handleSort('current_completion_date')} style={{ cursor: 'pointer' }}>
                Completion <SortIcon field="current_completion_date" sortField={sortField} sortDir={sortDir} />
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
                <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
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
                      title="View Details"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Project Cards List */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 120 }} />
          ))
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No projects found</div>
            <div className="empty-sub">Try adjusting your filters or search terms</div>
          </div>
        ) : (
          projects.map(p => (
            <div
              key={p.id}
              className="project-mobile-card"
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 'var(--gap)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {p.state_name || 'India'} · {p.sector_name || 'Infrastructure'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`badge ${statusBadgeClass(p.platform_status)}`}>
                  {statusLabel(p.platform_status)}
                </span>
                {p.current_completion_date && (
                  <span className="badge badge-sector">
                    Target: {new Date(p.current_completion_date).getFullYear()}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {formatCrore(p.current_cost_crore)}
                </span>
                <div style={{ width: '110px' }}>
                  <ProgressCell value={p.current_progress} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 'var(--gap-lg)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '8px' }}>
            {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, count)} of {count.toLocaleString()}
          </span>
          <button
            className="page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
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
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
