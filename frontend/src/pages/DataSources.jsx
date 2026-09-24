import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { refApi } from '../services/api';
import { formatDate } from '../utils/format';
import { Database, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';

function StatusDot({ status }) {
  const colors = {
    SUCCESS: 'var(--green)',
    FAILED: 'var(--red)',
    RUNNING: 'var(--yellow)',
    PARTIAL_SUCCESS: 'var(--orange)',
  };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: colors[status] || 'var(--text-muted)', marginRight: 6
    }} />
  );
}

export default function DataSources() {
  const { data: sources } = useApi(() => refApi.sources());
  const { data: runsData } = useApi(() => refApi.ingestionRuns({ page_size: 20 }));

  useEffect(() => { document.title = 'Data Sources — InfraIndia'; }, []);

  const runs = runsData?.results || runsData || [];
  const sourceList = sources?.results || sources || [];

  return (
    <div className="page-body">
      <Breadcrumbs />
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Data Sources</div>
          <div className="section-subtitle">Registered government data sources and ingestion history</div>
        </div>
      </div>

      {/* Sources */}
      <div className="section-header">
        <div className="section-title" style={{ fontSize: '0.95rem' }}>Registered Sources</div>
      </div>
      <div className="table-container mb-lg">
        <table>
          <thead>
            <tr>
              <th>Source Name</th>
              <th>Organization</th>
              <th>Type</th>
              <th>Access Method</th>
              <th>Status</th>
              <th>Last Successful Sync</th>
              <th>Update Frequency</th>
            </tr>
          </thead>
          <tbody>
            {sourceList.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon">📡</div>
                    <div className="empty-title">No sources registered</div>
                    <div className="empty-sub">Add a data source in the Admin panel</div>
                  </div>
                </td>
              </tr>
            ) : sourceList.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}><Database size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--accent)' }} />{s.name}</td>
                <td>{s.organization}</td>
                <td><span className="badge badge-sector">{s.source_type}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.access_method}</td>
                <td>
                  {s.is_active
                    ? <span className="badge badge-active"><CheckCircle size={10} /> Active</span>
                    : <span className="badge badge-unknown"><XCircle size={10} /> Inactive</span>
                  }
                </td>
                <td style={{ fontSize: '0.8rem' }}>{s.last_successful_sync ? formatDate(s.last_successful_sync) : '—'}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.update_frequency || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
