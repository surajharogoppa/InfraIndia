import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { analyticsApi, projectsApi } from '../services/api';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { formatCrore, formatPercent, progressClass } from '../utils/format';
import { MapPin, Info } from 'lucide-react';

// India TopoJSON — using a CDN-hosted file
const INDIA_GEO = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson';

export default function MapExplorer() {
  const navigate = useNavigate();
  const { data: states } = useApi(() => analyticsApi.states());
  const [selectedState, setSelectedState] = useState(null);
  const [stateProjects, setStateProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => { document.title = 'Map Explorer — GovProject Intelligence'; }, []);

  // Build lookup of state name → analytics
  const stateMap = {};
  (states || []).forEach(s => { stateMap[s.state_name?.toLowerCase()] = s; });

  function getStateColor(stateName) {
    const s = stateMap[stateName?.toLowerCase()];
    if (!s) return 'hsl(222 16% 18%)';
    const count = s.project_count || 0;
    const max = Math.max(...Object.values(stateMap).map(x => x.project_count || 0));
    const intensity = count / max;
    return `hsl(220 90% ${30 + intensity * 35}%)`;
  }

  async function handleStateClick(stateName) {
    setSelectedState(stateName);
    setLoadingProjects(true);
    try {
      const res = await projectsApi.list({ state: stateName, page_size: 10 });
      setStateProjects(res.data.results || res.data);
    } catch {
      setStateProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }

  const selectedStateData = selectedState ? stateMap[selectedState?.toLowerCase()] : null;

  return (
    <div className="page-body">
      <div className="section-header mb-lg">
        <div>
          <div className="section-title">Map Explorer</div>
          <div className="section-subtitle">
            Click a state to explore projects. Colour intensity = project count.
          </div>
        </div>
        <div className="platform-derived-note">
          <Info size={12} /> Map visualization — not an official government map
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedState ? '1.5fr 1fr' : '1fr', gap: 'var(--gap-lg)' }}>
        {/* Map */}
        <div className="map-wrap" style={{ position: 'relative' }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [82, 22], scale: 900 }}
            style={{ width: '100%', height: 520 }}
          >
            <Geographies geography={INDIA_GEO}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const name = geo.properties?.NAME_1 || geo.properties?.state || '';
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleStateClick(name)}
                      onMouseEnter={() => setTooltip(name)}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: getStateColor(name),
                          stroke: 'hsl(222 18% 24%)',
                          strokeWidth: 0.5,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        hover: {
                          fill: 'hsl(220 90% 65%)',
                          stroke: 'var(--accent)',
                          strokeWidth: 1,
                          outline: 'none',
                        },
                        pressed: {
                          fill: 'var(--accent)',
                          outline: 'none',
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
          {tooltip && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '6px 12px',
              fontSize: '0.82rem', fontWeight: 600, pointerEvents: 'none'
            }}>
              {tooltip}
              {stateMap[tooltip?.toLowerCase()] && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                  {stateMap[tooltip.toLowerCase()].project_count} projects
                </span>
              )}
            </div>
          )}
          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: '0.72rem', color: 'var(--text-muted)'
          }}>
            <div style={{ marginBottom: 4 }}>Project count intensity</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(i => (
                <div key={i} style={{
                  width: 20, height: 12, borderRadius: 2,
                  background: `hsl(220 90% ${30 + i * 35}%)`
                }} />
              ))}
              <span style={{ marginLeft: 4 }}>High</span>
            </div>
          </div>
        </div>

        {/* State Panel */}
        {selectedState && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
            <div className="card">
              <div className="card-title"><MapPin size={16} /> {selectedState}</div>
              {selectedStateData && (
                <div className="meta-grid">
                  <div className="meta-item">
                    <div className="meta-label">Projects</div>
                    <div className="meta-value" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                      {selectedStateData.project_count}
                    </div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Avg Progress</div>
                    <div className="meta-value">{formatPercent(selectedStateData.avg_progress)}</div>
                  </div>
                  <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="meta-label">Total Cost</div>
                    <div className="meta-value">{formatCrore(selectedStateData.total_cost_crore)}</div>
                  </div>
                  <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="meta-label">Total Expenditure</div>
                    <div className="meta-value">{formatCrore(selectedStateData.total_expenditure_crore)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="table-container" style={{ flex: 1 }}>
              <div className="table-header">
                <div className="table-title">Recent Projects</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(`/projects?state=${selectedState}`)}
                >
                  View all
                </button>
              </div>
              {loadingProjects ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ padding: 'var(--gap)' }}>
                    <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '60%', height: '0.7em' }} />
                  </div>
                ))
              ) : stateProjects.map(p => (
                <div
                  key={p.id}
                  style={{ padding: '10px var(--gap)', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 2 }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 'var(--gap-sm)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {p.sector_name && <span>{p.sector_name}</span>}
                    {p.current_cost_crore && <span>· {formatCrore(p.current_cost_crore)}</span>}
                    {p.current_progress != null && <span>· {p.current_progress}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
