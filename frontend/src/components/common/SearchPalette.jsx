import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../services/api';
import { formatCrore, statusBadgeClass, statusLabel } from '../../utils/format';
import { Search, X, Loader2, ArrowRight, CornerDownLeft } from 'lucide-react';

export default function SearchPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Global key listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await projectsApi.list({ search: query.trim(), page_size: 6 });
        setResults(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(p) {
    onClose();
    navigate(`/projects/${p.id}`);
  }

  function handleInputKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (query.trim()) {
        onClose();
        navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 16px 16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              color: 'var(--text-primary)'
            }}
            placeholder="Search projects by name, sector, ministry, or ID..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {loading && <Loader2 size={16} className="spin" color="var(--accent)" />}
          {query && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-muted)'
          }}>ESC</kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
          {results.length > 0 ? (
            results.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: idx === selectedIndex ? 'var(--bg-hover)' : 'transparent'
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(p)}
              >
                <div style={{ flex: 1, marginRight: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{p.state_name || 'India'}</span>
                    <span>·</span>
                    <span>{p.sector_name || 'Infrastructure'}</span>
                    <span>·</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatCrore(p.current_cost_crore)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${statusBadgeClass(p.platform_status)}`}>
                    {statusLabel(p.platform_status)}
                  </span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))
          ) : query.trim() && !loading ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No projects found matching &ldquo;{query}&rdquo;.
            </div>
          ) : !query.trim() ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Type to search central sector infrastructure projects across India...
            </div>
          ) : null}
        </div>

        {/* Footer shortcuts */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          {query.trim() && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              onClick={() => {
                onClose();
                navigate(`/projects?search=${encodeURIComponent(query.trim())}`);
              }}
            >
              View all results <CornerDownLeft size={11} style={{ marginLeft: 4 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
