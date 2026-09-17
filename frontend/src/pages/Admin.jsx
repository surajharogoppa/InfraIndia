import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { refApi } from '../services/api';
import { formatDate } from '../utils/format';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Play } from 'lucide-react';

const QUALITY_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CORRECTED', 'DUPLICATE'];

function StatusBadge({ status }) {
  const map = {
    PENDING: 'badge-unknown',
    ACCEPTED: 'badge-active',
    REJECTED: 'badge-closed',
    CORRECTED: 'badge-completed',
    DUPLICATE: 'badge-planned',
  };
  return <span className={`badge ${map[status] || 'badge-unknown'}`}>{status}</span>;
}

export default function Admin() {
  const [qTab, setQTab] = useState('PENDING');
  const { data: sources, refetch: refetchSources } = useApi(() => refApi.sources());
  const { data: runsData } = useApi(() => refApi.ingestionRuns({ page_size: 10 }));
  const { data: qualityData, refetch: refetchQuality } = useApi(
    () => refApi.qualityIssues({ status: qTab, page_size: 20 }),
    [qTab]
  );

  useEffect(() => { document.title = 'Admin — GovProject Intelligence'; }, []);

  const sourceList = sources?.results || sources || [];
  const runs = runsData?.results || runsData || [];
  const issues = qualityData?.results || qualityData || [];

  async function triggerSource(id) {
    try {
      await refApi.triggerIngestion(id);
      alert('Ingestion queued. Check ingestion runs for status.');
      refetchSources();
    } catch (e) {
      alert('Failed to queue ingestion: ' + (e.message || 'Unknown error'));
    }
  }

  async function resolveIssue(id, status) {
    await refApi.resolveIssue(id, { status });
    refetchQuality();
  }

  return (
    <div className="page-body">
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">
            <Shield size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Admin Dashboard
          </div>
          <div className="section-subtitle">Data source management, ingestion monitoring, data quality</div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="section-title" style={{ marginBottom: 'var(--gap-sm)' }}>Data Sources</div>
      <div className="table-container mb-lg">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Organization</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Sync</th>
              <th>Last Failed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sourceList.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📡</div><div className="empty-title">No sources</div></div></td></tr>
            ) : sourceList.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td style={{ fontSize: '0.82rem' }}>{s.organization}</td>
                <td><span className="badge badge-sector">{s.source_type}</span></td>
                <td>
                  {s.is_active
                    ? <span className="badge badge-active"><CheckCircle size={10} /> Active</span>
                    : <span className="badge badge-unknown"><XCircle size={10} /> Inactive</span>}
                </td>
                <td style={{ fontSize: '0.78rem' }}>{s.last_successful_sync ? formatDate(s.last_successful_sync) : '—'}</td>
                <td style={{ fontSize: '0.78rem', color: s.last_failed_sync ? 'var(--red)' : 'var(--text-muted)' }}>
                  {s.last_failed_sync ? formatDate(s.last_failed_sync) : '—'}
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => triggerSource(s.id)}>
                    <Play size={12} /> Run Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Ingestion Runs */}
      <div className="section-title" style={{ marginBottom: 'var(--gap-sm)' }}>Recent Ingestion Runs</div>
      <div className="table-container mb-lg">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Source</th><th>Status</th><th>Started</th>
              <th>Found</th><th>Inserted</th><th>Updated</th><th>Rejected</th><th>Error</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">🔄</div><div className="empty-title">No runs</div></div></td></tr>
            ) : runs.map(r => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{r.id}</td>
                <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{r.source_name}</td>
                <td>
                  <span className={`badge ${r.status === 'SUCCESS' ? 'badge-active' : r.status === 'FAILED' ? 'badge-closed' : 'badge-unknown'}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.78rem' }}>{formatDate(r.started_at)}</td>
                <td>{r.records_found}</td>
                <td style={{ color: 'var(--green)' }}>{r.records_inserted}</td>
                <td style={{ color: 'var(--blue)' }}>{r.records_updated}</td>
                <td style={{ color: r.records_rejected > 0 ? 'var(--red)' : 'inherit' }}>{r.records_rejected}</td>
                <td style={{ fontSize: '0.72rem', color: 'var(--red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.error_message || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Data Quality Queue */}
      <div className="section-header">
        <div className="section-title">Data Quality Queue</div>
        <div className="tabs">
          {QUALITY_STATUSES.map(s => (
            <button key={s} className={`tab${qTab === s ? ' active' : ''}`} onClick={() => setQTab(s)}>{s}</button>
          ))}
        </div>
      </div>
      <div className="table-container mt">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Record Ref</th>
              <th>Problem</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <div className="empty-title">No {qTab.toLowerCase()} issues</div>
                  </div>
                </td>
              </tr>
            ) : issues.map(issue => (
              <tr key={issue.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{issue.id}</td>
                <td style={{ fontSize: '0.82rem' }}>{issue.raw_record_ref || '—'}</td>
                <td style={{ fontSize: '0.82rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {issue.problem_description}
                </td>
                <td style={{ fontSize: '0.78rem' }}>{formatDate(issue.created_at)}</td>
                <td><StatusBadge status={issue.status} /></td>
                <td>
                  {issue.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => resolveIssue(issue.id, 'ACCEPTED')}>Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => resolveIssue(issue.id, 'REJECTED')}>Reject</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => resolveIssue(issue.id, 'DUPLICATE')}>Duplicate</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
