import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { projectsApi } from '../services/api';
import {
  formatCrore, formatCroreExact, formatDate, formatDateShort,
  formatPercent, statusBadgeClass, statusLabel, progressClass,
  changeTypeLabel
} from '../utils/format';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  ArrowLeft, MapPin, Building2, Calendar, TrendingUp,
  IndianRupee, Info, AlertTriangle, GitCommitHorizontal
} from 'lucide-react';

function SummaryCard({ label, value, sub, highlight }) {
  return (
    <div className="summary-card" style={highlight ? { borderColor: 'var(--accent)', background: 'hsl(220 90% 60% / 0.05)' } : {}}>
      <div className="summary-card-label">{label}</div>
      <div className="summary-card-value">{value || '—'}</div>
      {sub && <div className="summary-card-sub">{sub}</div>}
    </div>
  );
}

function PlatformDerivedTag() {
  return (
    <span className="platform-derived-note">
      <Info size={10} />
      Platform-calculated
    </span>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, loading } = useApi(() => projectsApi.detail(id), [id]);
  const { data: history } = useApi(() => projectsApi.history(id), [id]);
  const { data: changes } = useApi(() => projectsApi.changes(id), [id]);

  useEffect(() => {
    if (project) document.title = `${project.name} — GovProject Intelligence`;
  }, [project]);

  if (loading) {
    return (
      <div className="page-body">
        <div className="skeleton skeleton-title" />
        <div className="summary-cards">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return (
    <div className="page-body">
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">Project not found</div>
      </div>
    </div>
  );

  const progressData = (history || []).map(s => ({
    date: formatDateShort(s.snapshot_date),
    progress: s.physical_progress,
  })).reverse();

  const costChange = project.platform_cost_change_pct;
  const hasDelay = project.platform_schedule_delay_months > 0;

  return (
    <div className="page-body">
      {/* Back */}
      <button className="btn btn-ghost btn-sm mb" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Project Header */}
      <div style={{ marginBottom: 'var(--gap-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap)', flexWrap: 'wrap', marginBottom: 'var(--gap-sm)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, flex: 1 }}>
            {project.name}
          </h1>
          <span className={`badge ${statusBadgeClass(project.platform_status)}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
            {statusLabel(project.platform_status)}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap)' }}>
          {project.ministry_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Building2 size={13} /> {project.ministry_name}
            </span>
          )}
          {project.state_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <MapPin size={13} /> {project.state_name}{project.district_name ? `, ${project.district_name}` : ''}
            </span>
          )}
          {project.sector_name && (
            <span className="badge badge-sector">{project.sector_name}</span>
          )}
          {project.external_project_id && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              ID: {project.external_project_id}
            </span>
          )}
        </div>

        {/* Source attribution */}
        <div style={{ marginTop: 'var(--gap-sm)', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', gap: 12 }}>
          {project.source_name && <span>Source: <strong style={{ color: 'var(--text-secondary)' }}>{project.source_name}</strong></span>}
          {project.source_updated_date && <span>Source Updated: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(project.source_updated_date)}</strong></span>}
          {project.updated_at && <span>Platform Ingested: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(project.updated_at)}</strong></span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <SummaryCard label="Original Cost" value={formatCroreExact(project.original_cost_crore)} />
        <SummaryCard label="Current / Revised Cost" value={formatCroreExact(project.current_cost_crore)} highlight />
        <SummaryCard label="Expenditure" value={formatCroreExact(project.current_expenditure_crore)} sub={project.platform_expenditure_ratio != null ? <><PlatformDerivedTag /> {project.platform_expenditure_ratio}% of cost</> : null} />
        <SummaryCard
          label="Physical Progress"
          value={project.current_progress != null ? `${project.current_progress}%` : '—'}
          sub="As reported by source"
        />
        <SummaryCard label="Original Start" value={formatDateShort(project.original_start_date)} />
        <SummaryCard label="Original Completion" value={formatDateShort(project.original_completion_date)} />
        <SummaryCard label="Current Completion" value={formatDateShort(project.current_completion_date)} highlight={hasDelay} />
        <SummaryCard
          label="Schedule Difference"
          value={project.platform_schedule_delay_months != null
            ? `${project.platform_schedule_delay_months > 0 ? '+' : ''}${project.platform_schedule_delay_months} months`
            : '—'}
          sub={<PlatformDerivedTag />}
        />
      </div>

      {/* Main 2-col layout */}
      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>

          {/* Progress Chart */}
          {progressData.length > 1 && (
            <div className="card">
              <div className="card-title"><TrendingUp size={16} /> Historical Progress</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Progress']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="platform-derived-note mt-sm">
                <Info size={10} /> Based on platform snapshots — reflects source-reported values at ingestion dates
              </div>
            </div>
          )}

          {/* Cost Change */}
          {costChange != null && (
            <div className="card">
              <div className="card-title"><IndianRupee size={16} /> Cost Change</div>
              <div style={{ display: 'flex', gap: 'var(--gap-lg)', flexWrap: 'wrap', marginBottom: 'var(--gap-sm)' }}>
                <div>
                  <div className="meta-label">Original Cost</div>
                  <div className="meta-value">{formatCroreExact(project.original_cost_crore)}</div>
                </div>
                <div style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>→</div>
                <div>
                  <div className="meta-label">Current Cost</div>
                  <div className="meta-value">{formatCroreExact(project.current_cost_crore)}</div>
                </div>
              </div>
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--radius)',
                background: costChange > 0 ? 'hsl(0 72% 58% / 0.08)' : 'hsl(142 70% 48% / 0.08)',
                border: `1px solid ${costChange > 0 ? 'hsl(0 72% 58% / 0.25)' : 'hsl(142 70% 48% / 0.25)'}`,
                display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)', fontSize: '0.85rem'
              }}>
                {costChange > 0 ? <AlertTriangle size={14} color="var(--red)" /> : <TrendingUp size={14} color="var(--green)" />}
                <span style={{ color: costChange > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>
                  {costChange > 0 ? '+' : ''}{costChange}% change
                </span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <PlatformDerivedTag />
              </div>
            </div>
          )}

          {/* Schedule Change */}
          {project.platform_schedule_delay_months != null && (
            <div className="card">
              <div className="card-title"><Calendar size={16} /> Schedule</div>
              <div style={{ display: 'flex', gap: 'var(--gap-lg)', flexWrap: 'wrap', marginBottom: 'var(--gap-sm)' }}>
                <div>
                  <div className="meta-label">Original Completion</div>
                  <div className="meta-value">{formatDateShort(project.original_completion_date)}</div>
                </div>
                <div style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>→</div>
                <div>
                  <div className="meta-label">Current Completion</div>
                  <div className="meta-value">{formatDateShort(project.current_completion_date)}</div>
                </div>
              </div>
              {project.platform_schedule_delay_months !== 0 && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius)',
                  background: hasDelay ? 'hsl(42 95% 58% / 0.08)' : 'hsl(142 70% 48% / 0.08)',
                  border: `1px solid ${hasDelay ? 'hsl(42 95% 58% / 0.25)' : 'hsl(142 70% 48% / 0.25)'}`,
                  fontSize: '0.85rem', display: 'flex', gap: 'var(--gap-sm)', alignItems: 'center'
                }}>
                  <span style={{ color: hasDelay ? 'var(--yellow)' : 'var(--green)', fontWeight: 700 }}>
                    {hasDelay ? '+' : ''}{project.platform_schedule_delay_months} months difference
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <PlatformDerivedTag />
                </div>
              )}
            </div>
          )}

          {/* Change History */}
          <div className="card">
            <div className="card-title"><GitCommitHorizontal size={16} /> Change History</div>
            {(!changes || changes.length === 0) ? (
              <div className="empty-state" style={{ padding: 'var(--gap)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No changes detected yet</div>
              </div>
            ) : (
              <div className="change-log">
                {changes.map(c => (
                  <div className="change-log-item" key={c.id}>
                    <div className="change-dot" />
                    <div>
                      <div className="change-type-badge">{changeTypeLabel(c.change_type)}</div>
                      <div className="change-values">
                        <span className="change-old">{c.old_value || '—'}</span>
                        <span className="change-arrow">→</span>
                        <span className="change-new">{c.new_value || '—'}</span>
                        {c.change_percentage != null && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({c.change_percentage > 0 ? '+' : ''}{c.change_percentage.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                      <div className="change-date">{formatDate(c.detected_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>

          {/* Progress Card */}
          <div className="card">
            <div className="card-title">Physical Progress</div>
            {project.current_progress != null ? (
              <>
                <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {project.current_progress}%
                </div>
                <div className="progress-bar-track" style={{ height: 10, marginBottom: 8 }}>
                  <div
                    className={`progress-bar-fill ${progressClass(project.current_progress)}`}
                    style={{ width: `${project.current_progress}%` }}
                  />
                </div>
                <div className="section-subtitle">As reported by source</div>
              </>
            ) : (
              <div className="text-muted">Not reported</div>
            )}
          </div>

          {/* Project Info */}
          <div className="card">
            <div className="card-title"><Building2 size={16} /> Organization</div>
            <div className="meta-grid">
              {project.ministry_name && (
                <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="meta-label">Ministry</div>
                  <div className="meta-value">{project.ministry_name}</div>
                </div>
              )}
              {project.department_name && (
                <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="meta-label">Department</div>
                  <div className="meta-value">{project.department_name}</div>
                </div>
              )}
              {project.organization_name && (
                <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="meta-label">Organization</div>
                  <div className="meta-value">{project.organization_name}</div>
                </div>
              )}
              {project.contractor_name && (
                <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="meta-label">Contractor / Implementing Agency</div>
                  <div className="meta-value">{project.contractor_name}</div>
                </div>
              )}
              {project.source_status && (
                <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="meta-label">Source-Reported Status</div>
                  <div className="meta-value">{project.source_status}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-title"><Calendar size={16} /> Timeline</div>
            <div className="timeline">
              {project.original_start_date && (
                <div className="timeline-item done">
                  <div className="timeline-dot" />
                  <div className="timeline-label">Project Start</div>
                  <div className="timeline-date">{formatDate(project.original_start_date)}</div>
                </div>
              )}
              {project.original_completion_date && (
                <div className={`timeline-item ${hasDelay ? '' : 'current'}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-label">Original Completion</div>
                  <div className="timeline-date">{formatDate(project.original_completion_date)}</div>
                </div>
              )}
              {hasDelay && project.current_completion_date && (
                <div className="timeline-item current">
                  <div className="timeline-dot" />
                  <div className="timeline-label">Revised Completion</div>
                  <div className="timeline-date">{formatDate(project.current_completion_date)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
