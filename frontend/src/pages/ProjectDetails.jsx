import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { projectsApi } from '../services/api';
import {
  formatCroreExact, formatDate, formatDateShort,
  statusBadgeClass, statusLabel, progressClass,
  changeTypeLabel
} from '../utils/format';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList
} from 'recharts';
import ExportButton from '../components/ExportButton';
import {
  ArrowLeft, MapPin, Building2, Calendar, TrendingUp,
  IndianRupee, Info, AlertTriangle, GitCommitHorizontal,
  Database, ExternalLink, RefreshCw, GitCompare
} from 'lucide-react';

import { Card, CardHeader } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Breadcrumbs from '../components/common/Breadcrumbs';

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
    if (project) document.title = `${project.name} — InfraIndia`;
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
      <Breadcrumbs extra={project?.name} />
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={`badge ${statusBadgeClass(project.platform_status)}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              {statusLabel(project.platform_status)}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/compare?id=${project.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <GitCompare size={14} /> Compare
            </button>
          </div>
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

        {/* Source info panel */}
        <div className="project-source-banner">
          <div className="project-source-item">
            <Database size={13} />
            <span>
              <strong>Source:</strong>{' '}
              {project.source_name || 'MoSPI Flash Report (PAIMANA)'}
            </span>
          </div>
          <div className="project-source-item">
            <Building2 size={13} />
            <span>Ministry of Statistics &amp; Programme Implementation</span>
          </div>
          {project.updated_at && (
            <div className="project-source-item">
              <RefreshCw size={12} style={{ color: 'var(--green)' }} />
              <span>Last synced: <strong>{formatDate(project.updated_at)}</strong></span>
            </div>
          )}
          <a
            href={project.source_url || 'https://mospi.gov.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="project-source-link"
          >
            <ExternalLink size={12} /> View Source
          </a>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="kpi-grid mb-lg">
        <StatCard 
          title="Original Cost" 
          value={formatCroreExact(project.original_cost_crore)} 
          color="hsl(220 12% 65%)"
          bgColor="var(--bg-card)"
        />
        <StatCard 
          title="Current Cost" 
          value={formatCroreExact(project.current_cost_crore)} 
          color="hsl(42 95% 58%)"
          bgColor="var(--bg-card)"
          trend={costChange}
          trendLabel={<><PlatformDerivedTag /> cost change</>}
        />
        <StatCard 
          title="Expenditure" 
          value={formatCroreExact(project.current_expenditure_crore)} 
          sub={project.platform_expenditure_ratio != null ? <><PlatformDerivedTag /> {project.platform_expenditure_ratio}% of current cost</> : null} 
          color="hsl(174 65% 48%)"
          bgColor="var(--bg-card)"
        />
        <StatCard
          title="Physical Progress"
          value={project.current_progress != null ? `${project.current_progress}%` : '—'}
          description="As reported by source"
          color="hsl(262 80% 65%)"
          bgColor="var(--bg-card)"
        />
      </div>
      
      {/* Schedule Cards */}
      <div className="kpi-grid mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard title="Original Start" value={formatDateShort(project.original_start_date)} bgColor="var(--bg-card)" color="transparent" />
        <StatCard title="Original Completion" value={formatDateShort(project.original_completion_date)} bgColor="var(--bg-card)" color="transparent" />
        <StatCard title="Current Completion" value={formatDateShort(project.current_completion_date)} bgColor="var(--bg-card)" color={hasDelay ? "var(--red)" : "transparent"} />
        <StatCard
          title="Schedule Difference"
          value={project.platform_schedule_delay_months != null
            ? `${project.platform_schedule_delay_months > 0 ? '+' : ''}${project.platform_schedule_delay_months} months`
            : '—'}
          description={<PlatformDerivedTag />}
          bgColor="var(--bg-card)"
          color="transparent"
        />
      </div>

      {/* Main 2-col layout */}
      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>

          {/* Progress Chart */}
          {progressData.length > 1 && (
            <Card id="project-details-progress" style={{ padding: 'var(--gap)' }}>
              <CardHeader 
                title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} /> Historical Progress</span>}
                action={<ExportButton targetId="project-details-progress" fileName={`project_${id}_progress`} />}
              />
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={progressData} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Progress']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent)', r: 3.5 }}
                    activeDot={{ r: 5 }}
                  >
                    <LabelList dataKey="progress" position="top" fill="var(--text-secondary)" fontSize={10} formatter={(v) => `${v}%`} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
              <div className="platform-derived-note mt-sm">
                <Info size={10} /> Based on platform snapshots — reflects source-reported values at ingestion dates
              </div>
            </Card>
          )}

          {/* Cost Change */}
          {costChange != null && (
            <Card style={{ padding: 'var(--gap)' }}>
              <CardHeader title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IndianRupee size={16} /> Cost Change</span>} />
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
            </Card>
          )}

          {/* Schedule Change */}
          {project.platform_schedule_delay_months != null && (
            <Card style={{ padding: 'var(--gap)' }}>
              <CardHeader title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Schedule Change</span>} />
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
            </Card>
          )}

          {/* Change History */}
          <Card style={{ padding: 'var(--gap)' }}>
            <CardHeader title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GitCommitHorizontal size={16} /> Change History</span>} />
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
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>

          {/* Progress Card */}
          <Card style={{ padding: 'var(--gap)' }}>
            <CardHeader title="Physical Progress" />
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
          </Card>

          {/* Project Info */}
          <Card style={{ padding: 'var(--gap)' }}>
            <CardHeader title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Building2 size={16} /> Organization</span>} />
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
          </Card>

          {/* Timeline */}
          <Card style={{ padding: 'var(--gap)' }}>
            <CardHeader title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Timeline</span>} />
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
          </Card>
        </div>
      </div>
    </div>
  );
}
