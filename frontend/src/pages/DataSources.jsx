import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { refApi } from '../services/api';
import { formatDate } from '../utils/format';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import {
  Database,
  Download,
  ExternalLink,
  FileText,
  FileCode,
  Table,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Search,
  Copy,
  Check,
  Layers,
  ShieldCheck,
  ArrowDownToLine,
  Globe2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export default function DataSources() {
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamically fetch documents and sources from backend
  const { data: docsData, loading: docsLoading, refetch: refetchDocs } = useApi(() => refApi.documents());
  const { data: sources, refetch: refetchSources } = useApi(() => refApi.sources());

  useEffect(() => {
    document.title = 'Data Sources & Downloadable Reports — InfraIndia';
  }, []);

  const documents = docsData?.results || (Array.isArray(docsData) ? docsData : []);
  const sourceList = sources?.results || (Array.isArray(sources) ? sources : []);

  // Dynamically extract available formats from registered documents
  const availableFormats = ['ALL', ...new Set(documents.map((d) => d.format).filter(Boolean))];

  const getDocumentPreviewUrl = (doc) => {
    if (!doc) return '';
    if (doc.preview_url) return doc.preview_url;
    if (doc.id) return `http://localhost:8000/api/documents/${doc.id}/preview/`;
    return doc.file_url || doc.source_url || '';
  };

  const getDocumentDownloadUrl = (doc) => {
    if (!doc) return '';
    if (doc.download_url) return doc.download_url;
    if (doc.id) return `http://localhost:8000/api/documents/${doc.id}/download/`;
    return doc.file_url || doc.source_url || '';
  };

  const handleOpenPreview = async (doc) => {
    const previewUrl = getDocumentPreviewUrl(doc);
    setPreviewDoc(doc);
    setPreviewContent('');

    if (doc.format === 'PDF') {
      setLoadingPreview(false);
      return;
    }

    if (doc.format === 'XLSX' || doc.format === 'XLS') {
      setLoadingPreview(false);
      return;
    }

    setLoadingPreview(true);
    try {
      const res = await fetch(previewUrl);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const text = await res.text();
      setPreviewContent(text);
    } catch {
      setPreviewContent('Unable to fetch preview. Please use the Direct Download button.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCopyPreview = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesFormat = selectedFormat === 'ALL' || doc.format === selectedFormat;
    const matchesQuery =
      searchQuery === '' ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.period?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.format?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFormat && matchesQuery;
  });

  return (
    <div className="page-body" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <Breadcrumbs />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--accent)',
            marginBottom: '8px'
          }}>
            <Database size={13} />
            Public Data Provenance
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 8px',
            letterSpacing: '-0.02em'
          }}>
            Data Sources & Downloadable Reports
          </h1>
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            margin: 0,
            maxWidth: '750px',
            lineHeight: 1.55
          }}>
            All project data on InfraIndia originates from official public releases. Download the raw source documents (PDF reports, XML feeds, CSV datasets) directly or inspect their origin on official government portals.
          </p>
        </div>

        {/* Refresh Action */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => { refetchDocs(); refetchSources(); }}
            className="btn btn-ghost btn-sm"
            title="Refresh documents list"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '32px'
      }}>
        <Card style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius)',
              background: 'hsl(220 90% 55% / 0.12)', color: 'var(--accent)',
              display: 'grid', placeItems: 'center', flexShrink: 0
            }}>
              <ArrowDownToLine size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {documents.length} Managed Files
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Active in Admin Panel
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius)',
              background: 'hsl(152 70% 45% / 0.12)', color: 'var(--green)',
              display: 'grid', placeItems: 'center', flexShrink: 0
            }}>
              <Globe2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Internet Fetched
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                MoSPI & Open Data (OGD)
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius)',
              background: 'hsl(262 80% 65% / 0.12)', color: 'hsl(262 80% 65%)',
              display: 'grid', placeItems: 'center', flexShrink: 0
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Live Database Sync
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Reflects Admin Changes
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Downloadable Reports Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
              Download Raw Source Reports & Datasets
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Live documents managed via the Django Admin panel. Direct downloads and official external links.
            </p>
          </div>

          {/* Search & Format Filter */}
          {documents.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 30px',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    width: '180px'
                  }}
                />
              </div>

              {availableFormats.length > 1 && (
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '2px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  {availableFormats.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: selectedFormat === fmt ? 'var(--accent)' : 'transparent',
                        color: selectedFormat === fmt ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {fmt === 'ALL' ? 'All Formats' : fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document Cards List */}
        <div className="source-docs-grid">
          {docsLoading ? (
            <Card style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading source documents from backend...
            </Card>
          ) : documents.length === 0 ? (
            <Card style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius)',
                background: 'var(--bg-hover)', color: 'var(--text-muted)',
                display: 'grid', placeItems: 'center', margin: '0 auto 12px'
              }}>
                <FolderOpen size={24} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                No Source Documents Registered
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
                Documents deleted or removed from the admin panel will not appear here. Source documents can be registered and managed in the Admin Portal.
              </p>
            </Card>
          ) : filteredDocs.length === 0 ? (
            <Card style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No source documents found matching "{searchQuery}".
            </Card>
          ) : (
            filteredDocs.map((doc) => {
              const isPdf = doc.format === 'PDF';
              const isXml = doc.format === 'XML';
              const isCsv = doc.format === 'CSV';

              return (
                <div key={doc.id} className="source-doc-card">
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Left: Icon, Badges & Title */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        background: isPdf
                          ? 'hsl(0 75% 50% / 0.12)'
                          : isXml
                          ? 'hsl(38 92% 50% / 0.12)'
                          : isCsv
                          ? 'hsl(152 70% 45% / 0.12)'
                          : 'hsl(220 90% 55% / 0.12)',
                        color: isPdf
                          ? 'hsl(0 80% 65%)'
                          : isXml
                          ? 'hsl(38 95% 55%)'
                          : isCsv
                          ? 'hsl(152 75% 45%)'
                          : 'var(--accent)'
                      }}>
                        {isPdf && <FileText size={20} />}
                        {isXml && <FileCode size={20} />}
                        {isCsv && <Table size={20} />}
                        {!isPdf && !isXml && !isCsv && <Database size={20} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span className={`doc-badge ${isPdf ? 'doc-badge-pdf' : isXml ? 'doc-badge-xml' : isCsv ? 'doc-badge-csv' : ''}`}>
                            {doc.format || 'FILE'}
                          </span>
                          {doc.period && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              • {doc.period}
                            </span>
                          )}
                          {doc.size && doc.size !== '—' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              • {doc.size}
                            </span>
                          )}
                          {doc.records_count && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--bg-hover)',
                              color: 'var(--text-secondary)'
                            }}>
                              {doc.records_count}
                            </span>
                          )}
                        </div>

                        <h3 style={{
                          fontSize: '0.96rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: '0 0 6px',
                          letterSpacing: '-0.01em'
                        }}>
                          {doc.title}
                        </h3>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {doc.description}
                        </p>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                          <strong>Source Agency:</strong> {doc.source_agency || 'Government of India'}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      alignSelf: 'center'
                    }}>
                      {/* Direct Download Button */}
                      {(doc.download_url || doc.file_url || doc.file || doc.id) && (
                        <a
                          href={getDocumentDownloadUrl(doc)}
                          download={doc.filename}
                          className="btn btn-primary btn-sm"
                          style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            padding: '6px 14px'
                          }}
                          title={`Download ${doc.filename || doc.title} directly`}
                        >
                          <Download size={14} />
                          <span>Download {doc.format || 'File'}</span>
                        </a>
                      )}

                      {/* Preview Button for XML/CSV/PDF */}
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(doc)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.78rem',
                          padding: '6px 12px'
                        }}
                        title={`Preview ${doc.format || 'data'}`}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>

                      {/* Official Internet Source Link */}
                      {doc.source_url && (
                        <a
                          href={doc.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            padding: '6px 12px'
                          }}
                          title="View official publication portal"
                        >
                          <ExternalLink size={13} />
                          <span>Internet Source</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Registered Data Sources Table */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', marginBottom: '36px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
            Registered Government Data Sources
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Configured administrative sources and scheduled ingestion sync registries.
          </p>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Organization</th>
                <th>Type</th>
                <th>Access Method</th>
                <th>Status</th>
                <th>Last Sync</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {sourceList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No data sources registered.
                  </td>
                </tr>
              ) : (
                sourceList.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Database size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--accent)' }} />
                      {s.name}
                    </td>
                    <td>{s.organization}</td>
                    <td><span className="badge badge-sector">{s.source_type}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.access_method}</td>
                    <td>
                      {s.is_active ? (
                        <span className="badge badge-active"><CheckCircle2 size={10} /> Active</span>
                      ) : (
                        <span className="badge badge-unknown"><XCircle size={10} /> Inactive</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{s.last_successful_sync ? formatDate(s.last_successful_sync) : '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.update_frequency || 'Monthly'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingestion Pipeline Architecture Card */}
      <div style={{
        padding: '20px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Layers size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Automated Ingestion & Normalization Pipeline
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
          InfraIndia acquires raw files directly from government portals. Our automated ingestion pipeline extracts data tables from multi-page flash reports and machine feeds, normalizes project codes and currencies to ₹ Crore, cross-checks milestone changes against historical snapshots, and indexes entries for rapid search.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '0.76rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>1. Acquisition</strong>
            Scheduled download of PDF / XML flash reports from MoSPI.
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>2. Table Extraction</strong>
            Parsing complex tables into structured relational records.
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>3. Quality Audit</strong>
            Validation of cost escalations, time overruns, and duplicates.
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>4. Intelligence Delivery</strong>
            Surfacing analytics, comparison tools, and interactive GIS maps.
          </div>
        </div>
      </div>

      {/* Preview Modal for PDF / XML / CSV / XLSX */}
      {previewDoc && (
        <div className="doc-preview-modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div
            className="doc-preview-modal"
            style={previewDoc.format === 'PDF' ? { maxWidth: '1060px', width: '95vw', height: '90vh' } : {}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doc-preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <span className={`doc-badge ${previewDoc.format === 'PDF' ? 'doc-badge-pdf' : previewDoc.format === 'XML' ? 'doc-badge-xml' : previewDoc.format === 'CSV' ? 'doc-badge-csv' : ''}`}>
                  {previewDoc.format || 'FILE'} Preview
                </span>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {previewDoc.filename || previewDoc.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {previewDoc.format === 'PDF' ? (
                  <a
                    href={getDocumentPreviewUrl(previewDoc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ textDecoration: 'none', fontSize: '0.74rem', gap: '4px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center' }}
                    title="Open PDF preview in a new tab"
                  >
                    <ExternalLink size={13} />
                    <span>Open in Tab</span>
                  </a>
                ) : previewDoc.format !== 'XLSX' && previewDoc.format !== 'XLS' ? (
                  <button
                    type="button"
                    onClick={handleCopyPreview}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.74rem', gap: '4px', padding: '4px 10px' }}
                  >
                    {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy Content'}</span>
                  </button>
                ) : null}

                <a
                  href={getDocumentDownloadUrl(previewDoc)}
                  download={previewDoc.filename}
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none', fontSize: '0.74rem', gap: '4px', padding: '4px 10px' }}
                >
                  <Download size={13} />
                  <span>Download {previewDoc.format || 'File'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label="Close Preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="doc-preview-body" style={previewDoc.format === 'PDF' ? { padding: 0, height: 'calc(90vh - 65px)', overflow: 'hidden' } : {}}>
              {previewDoc.format === 'PDF' ? (
                <iframe
                  src={getDocumentPreviewUrl(previewDoc)}
                  title={previewDoc.title || 'PDF Preview'}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                    background: '#525659'
                  }}
                />
              ) : previewDoc.format === 'XLSX' || previewDoc.format === 'XLS' ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--radius)',
                    background: 'hsl(152 70% 45% / 0.12)', color: 'hsl(152 75% 45%)',
                    display: 'grid', placeItems: 'center', margin: '0 auto 16px'
                  }}>
                    <Table size={26} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                    Spreadsheet Dataset ({previewDoc.format})
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Binary spreadsheet formats cannot be displayed as plain text in the browser. You can download the complete dataset to view in Excel, Google Sheets, or LibreOffice.
                  </p>
                  <a
                    href={getDocumentDownloadUrl(previewDoc)}
                    download={previewDoc.filename}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                  >
                    <Download size={16} />
                    <span>Download {previewDoc.filename || 'Spreadsheet'}</span>
                  </a>
                </div>
              ) : loadingPreview ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading {previewDoc.format} data...
                </div>
              ) : (
                <pre className="doc-preview-code">
                  {previewContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
