import { useEffect, useState, useMemo, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { analyticsApi, projectsApi, refApi } from '../services/api';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import ExportButton from '../components/ExportButton';
import { formatCrore, formatPercent } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import {
  MapPin, ArrowRight,
  Search, X, ZoomIn, ZoomOut, RotateCcw,
  SlidersHorizontal, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import Breadcrumbs from '../components/common/Breadcrumbs';
import indiaGeo from '../assets/india_states.json';

function normalizeStateName(name) {
  if (!name) return '';
  const clean = name.trim().toLowerCase().replace(/&/g, 'and');
  if (clean.includes('kashmir')) return 'jammu and kashmir';
  if (clean.includes('ladakh')) return 'ladakh';
  if (clean.includes('delhi')) return 'delhi';
  if (clean.includes('andaman')) return 'andaman and nicobar';
  if (clean.includes('dadra') || clean.includes('daman')) return 'dadra and nagar haveli and daman and diu';
  if (clean.includes('odisha') || clean.includes('orissa')) return 'odisha';
  if (clean.includes('puducherry') || clean.includes('pondicherry')) return 'puducherry';
  if (clean.includes('uttarakhand') || clean.includes('uttaranchal')) return 'uttarakhand';
  return clean;
}

// Distinct Soft, Slightly Light Colors for All 37 Indian States & UTs (Atlas Palette)
const STATE_COLORS = {
  // Northern Region
  'jammu and kashmir': { color: '#93c5fd', light: '#bfdbfe', dark: '#38bdf8' },
  'ladakh': { color: '#c4b5fd', light: '#ddd6fe', dark: '#a78bfa' },
  'himachal pradesh': { color: '#86efac', light: '#bbf7d0', dark: '#34d399' },
  'punjab': { color: '#fde047', light: '#fef08a', dark: '#fbbf24' },
  'haryana': { color: '#f9a8d4', light: '#fbcfe8', dark: '#f472b6' },
  'uttarakhand': { color: '#67e8f9', light: '#a5f3fc', dark: '#22d3ee' },
  'delhi': { color: '#fca5a5', light: '#fecaca', dark: '#f87171' },
  'rajasthan': { color: '#fdba74', light: '#fed7aa', dark: '#fb923c' },
  'uttar pradesh': { color: '#a5b4fc', light: '#c7d2fe', dark: '#818cf8' },
  'chandigarh': { color: '#5eead4', light: '#99f6e4', dark: '#2dd4bf' },

  // Central Region
  'madhya pradesh': { color: '#7dd3fc', light: '#bae6fd', dark: '#38bdf8' },
  'chhattisgarh': { color: '#d8b4fe', light: '#e9d5ff', dark: '#c084fc' },

  // Western Region
  'gujarat': { color: '#fde047', light: '#fef08a', dark: '#facc15' },
  'maharashtra': { color: '#c4b5fd', light: '#ddd6fe', dark: '#a78bfa' },
  'goa': { color: '#f0abfc', light: '#f5d0fe', dark: '#e879f9' },
  'dadra and nagar haveli and daman and diu': { color: '#fda4af', light: '#fecdd3', dark: '#fb7185' },

  // Eastern Region
  'bihar': { color: '#86efac', light: '#bbf7d0', dark: '#34d399' },
  'jharkhand': { color: '#fda4af', light: '#fecdd3', dark: '#fb7185' },
  'odisha': { color: '#fcd34d', light: '#fde68a', dark: '#fbbf24' },
  'west bengal': { color: '#67e8f9', light: '#a5f3fc', dark: '#22d3ee' },
  'andaman and nicobar': { color: '#7dd3fc', light: '#bae6fd', dark: '#38bdf8' },

  // Southern Region
  'andhra pradesh': { color: '#5eead4', light: '#99f6e4', dark: '#2dd4bf' },
  'telangana': { color: '#fdba74', light: '#fed7aa', dark: '#fb923c' },
  'karnataka': { color: '#86efac', light: '#bbf7d0', dark: '#4ade80' },
  'tamil nadu': { color: '#93c5fd', light: '#bfdbfe', dark: '#60a5fa' },
  'kerala': { color: '#6ee7b7', light: '#a7f3d0', dark: '#10b981' },
  'puducherry': { color: '#d8b4fe', light: '#e9d5ff', dark: '#c084fc' },
  'lakshadweep': { color: '#67e8f9', light: '#a5f3fc', dark: '#22d3ee' },

  // North-Eastern Region
  'sikkim': { color: '#bef264', light: '#d9f99d', dark: '#a3e635' },
  'assam': { color: '#fdba74', light: '#fed7aa', dark: '#fb923c' },
  'arunachal pradesh': { color: '#a5b4fc', light: '#c7d2fe', dark: '#818cf8' },
  'nagaland': { color: '#f0abfc', light: '#f5d0fe', dark: '#e879f9' },
  'manipur': { color: '#7dd3fc', light: '#bae6fd', dark: '#38bdf8' },
  'mizoram': { color: '#86efac', light: '#bbf7d0', dark: '#34d399' },
  'tripura': { color: '#fde047', light: '#fef08a', dark: '#fbbf24' },
  'meghalaya': { color: '#f9a8d4', light: '#fbcfe8', dark: '#f472b6' },
};

// Indian Geopolitical Zones
const ZONES = {
  north: {
    name: 'North Zone',
    colorDark: 'hsl(215 70% 50%)',
    colorLight: 'hsl(215 80% 82%)',
    states: ['jammu and kashmir', 'ladakh', 'himachal pradesh', 'punjab', 'haryana', 'delhi', 'chandigarh', 'rajasthan', 'uttarakhand', 'uttar pradesh']
  },
  west: {
    name: 'West Zone',
    colorDark: 'hsl(28 75% 50%)',
    colorLight: 'hsl(28 90% 82%)',
    states: ['gujarat', 'maharashtra', 'goa', 'dadra and nagar haveli and daman and diu']
  },
  south: {
    name: 'South Zone',
    colorDark: 'hsl(145 60% 45%)',
    colorLight: 'hsl(145 65% 80%)',
    states: ['karnataka', 'kerala', 'tamil nadu', 'andhra pradesh', 'telangana', 'puducherry', 'lakshadweep']
  },
  east: {
    name: 'East Zone',
    colorDark: 'hsl(270 65% 55%)',
    colorLight: 'hsl(270 70% 83%)',
    states: ['bihar', 'jharkhand', 'odisha', 'west bengal', 'andaman and nicobar']
  },
  central: {
    name: 'Central Zone',
    colorDark: 'hsl(340 70% 55%)',
    colorLight: 'hsl(340 75% 83%)',
    states: ['madhya pradesh', 'chhattisgarh']
  },
  northeast: {
    name: 'Northeast Zone',
    colorDark: 'hsl(175 70% 45%)',
    colorLight: 'hsl(175 65% 78%)',
    states: ['assam', 'arunachal pradesh', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura']
  }
};

function getStateZone(stateName) {
  const norm = normalizeStateName(stateName);
  for (const [key, zone] of Object.entries(ZONES)) {
    if (zone.states.includes(norm)) return { key, ...zone };
  }
  return null;
}

// Thermal Heatmap palette: Low (Cool Blue) -> Cyan -> Green -> Warm Yellow -> Fiery Red (High)
const HEATMAP_STOPS_DARK = [
  { p: 0.0, r: 37, g: 99, b: 235 },   // #2563eb Blue
  { p: 0.25, r: 6, g: 182, b: 212 },  // #06b6d4 Cyan
  { p: 0.5, r: 34, g: 197, b: 94 },   // #22c55e Green
  { p: 0.75, r: 245, g: 158, b: 11 }, // #f59e0b Amber
  { p: 1.0, r: 239, g: 68, b: 68 },   // #ef4444 Fiery Red
];

const HEATMAP_STOPS_LIGHT = [
  { p: 0.0, r: 147, g: 197, b: 253 }, // #93c5fd Soft sky blue
  { p: 0.25, r: 103, g: 232, b: 249 }, // #67e8f9 Cyan
  { p: 0.5, r: 134, g: 239, b: 172 },  // #86efac Fresh green
  { p: 0.75, r: 253, g: 224, b: 71 },  // #fde047 Warm yellow
  { p: 1.0, r: 248, g: 113, b: 113 },  // #f87171 Coral red
];

function getSpectrumColor(t, isDark) {
  const clamped = Math.min(Math.max(t, 0), 1);
  const stops = isDark ? HEATMAP_STOPS_DARK : HEATMAP_STOPS_LIGHT;
  let i = 0;
  while (i < stops.length - 1 && clamped > stops[i + 1].p) {
    i++;
  }
  if (i >= stops.length - 1) {
    const last = stops[stops.length - 1];
    return `rgb(${last.r}, ${last.g}, ${last.b})`;
  }
  const s0 = stops[i];
  const s1 = stops[i + 1];
  const factor = (clamped - s0.p) / (s1.p - s0.p);
  const r = Math.round(s0.r + (s1.r - s0.r) * factor);
  const g = Math.round(s0.g + (s1.g - s0.g) * factor);
  const b = Math.round(s0.b + (s1.b - s0.b) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

// Progress traffic-light color
function getProgressColor(progress, isDark) {
  if (progress == null || progress === 0) return isDark ? 'hsl(222 16% 22%)' : 'hsl(215 16% 88%)';
  if (progress < 35) return isDark ? 'hsl(0 75% 55%)' : 'hsl(0 75% 50%)';
  if (progress < 55) return isDark ? 'hsl(28 90% 55%)' : 'hsl(28 90% 50%)';
  if (progress < 75) return isDark ? 'hsl(45 95% 52%)' : 'hsl(42 95% 45%)';
  return isDark ? 'hsl(142 75% 48%)' : 'hsl(142 75% 40%)';
}

const LABEL_OFFSETS = {
  // North
  'ladakh': [0, -6],
  'jammu and kashmir': [-16, -10],
  'himachal pradesh': [16, -2],
  'punjab': [-16, 8],
  'haryana': [-4, 14],
  'uttarakhand': [18, 6],

  // Central / East
  'jharkhand': [-14, -2],
  'west bengal': [14, 16],
  'chhattisgarh': [-10, 0],
  'odisha': [10, 6],

  // South
  'telangana': [0, -8],
  'andhra pradesh': [8, 18],
  'karnataka': [-6, 6],
  'goa': [-24, 0],
  'kerala': [-14, 14],
  'tamil nadu': [14, 10],

  // Northeast
  'sikkim': [0, -16],
  'assam': [12, -10],
  'arunachal pradesh': [28, -16],
  'meghalaya': [-6, 14],
  'nagaland': [34, -6],
  'manipur': [34, 8],
  'mizoram': [18, 26],
  'tripura': [-15, 24]
};

// Extremely small states/UTs where labels will always be hidden (use hover instead)
const HIDE_LABELS = new Set([
  'delhi', 'chandigarh', 'puducherry', 'lakshadweep',
  'dadra and nagar haveli and daman and diu', 'andaman and nicobar'
]);

const MemoizedGeographies = memo(({ indiaGeo, selectedState, handleStateClick, setTooltip, getStateColor, isDark, stateMap, selectedMetric }) => (
  <Geographies geography={indiaGeo}>
    {({ geographies }) => {
      const markers = [];

      const paths = geographies.map(geo => {
        const geoName = geo.properties?.ST_NM || geo.properties?.NAME_1 || geo.properties?.state || '';
        const norm = normalizeStateName(geoName);
        const data = stateMap[norm] || null;
        const isSelected = selectedState && normalizeStateName(selectedState) === norm;
        const centroid = geoCentroid(geo);

        const offset = LABEL_OFFSETS[norm] || [0, 0];
        const [dx, dy] = offset;
        const showLabel = !HIDE_LABELS.has(norm);

        let labelValue = '';
        if (data) {
          if (selectedMetric === 'project_count') labelValue = data.project_count;
          else if (selectedMetric === 'total_cost_crore') labelValue = Math.round(data.total_cost_crore);
          else if (selectedMetric === 'total_expenditure_crore') labelValue = Math.round(data.total_expenditure_crore);
          else if (selectedMetric === 'avg_progress') labelValue = `${Math.round(data.avg_progress)}%`;
        }

        if (data && showLabel) {
          markers.push({
            key: `marker-${geo.rsmKey}`,
            centroid,
            dx,
            dy,
            geoName: geoName.replace('Jammu and Kashmir', 'Jammu & Kashmir'),
            labelValue
          });
        }

        return (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            onClick={() => handleStateClick(geoName)}
            onMouseEnter={() => setTooltip({ name: geoName, data })}
            onMouseLeave={() => setTooltip(null)}
            fill={isSelected ? 'var(--accent)' : getStateColor(geoName)}
            stroke={isDark ? 'hsl(222 22% 14%)' : '#ffffff'}
            strokeWidth={isSelected ? 2.5 : 0.85}
            className="map-state-path"
            style={{ outline: 'none', cursor: 'pointer' }}
          />
        );
      });

      return (
        <>
          <g id="map-states-paths">{paths}</g>
          <g id="map-states-labels" style={{ pointerEvents: 'none' }}>
            {markers.map(m => (
              <Marker key={m.key} coordinates={m.centroid}>
                <text
                  y={m.dy}
                  fontSize={10.2}
                  textAnchor="middle"
                  fill={isDark ? '#f8fafc' : '#0f172a'}
                  stroke={isDark ? 'hsl(222 24% 12%)' : '#ffffff'}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  style={{
                    paintOrder: 'stroke fill',
                    fontWeight: 700
                  }}
                >
                  <tspan x={m.dx} dy="-0.3em">{m.geoName}</tspan>
                  <tspan
                    x={m.dx}
                    dy="1.15em"
                    fontSize="9.8px"
                    fontWeight="800"
                    fill={isDark ? '#38bdf8' : '#0284c7'}
                    stroke={isDark ? 'hsl(222 24% 12%)' : '#ffffff'}
                    strokeWidth={2}
                    style={{ paintOrder: 'stroke fill' }}
                  >
                    {m.labelValue}
                  </tspan>
                </text>
              </Marker>
            ))}
          </g>
        </>
      );
    }}
  </Geographies>
));


export default function MapExplorer() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Slicer States (Slice & Dice)
  const [selectedMetric, setSelectedMetric] = useState('project_count');
  const [selectedPalette, setSelectedPalette] = useState('colorful'); // 'colorful' | 'zonal' | 'spectrum' | 'progress' | 'monochrome'
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Zoom and Pan States (default 100% zoom so full India fits container exactly on landing)
  const [zoom, setZoom] = useState(0.90);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

  // Data fetching
  const { data: sectorsData } = useApi(() => refApi.sectors());
  const { data: statesData } = useApi(
    () => analyticsApi.states({ sector: selectedSector, status: selectedStatus }),
    [selectedSector, selectedStatus]
  );

  const sectorList = useMemo(() => {
    if (Array.isArray(sectorsData)) return sectorsData;
    return sectorsData?.results || [];
  }, [sectorsData]);

  const stateList = useMemo(() => {
    if (Array.isArray(statesData)) return statesData;
    return statesData?.results || [];
  }, [statesData]);

  // Selected State Drilldown
  const [selectedState, setSelectedState] = useState(null);
  const [stateProjects, setStateProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    document.title = 'Map Explorer — InfraIndia';
  }, []);

  // Prevent default scroll behavior when using wheel on map
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const preventScroll = (e) => {
      e.preventDefault();
    };
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventScroll);
  }, []);

  // Lookup of normalized state name -> analytics
  const stateMap = useMemo(() => {
    const map = {};
    stateList.forEach(s => {
      const key = normalizeStateName(s.state_name);
      map[key] = s;
    });
    return map;
  }, [stateList]);

  // Max values for selected metric scaling
  const maxValues = useMemo(() => {
    let maxCount = 1;
    let maxCost = 1;
    let maxSpend = 1;
    stateList.forEach(s => {
      if (s.project_count > maxCount) maxCount = s.project_count;
      if (s.total_cost_crore > maxCost) maxCost = s.total_cost_crore;
      if (s.total_expenditure_crore > maxSpend) maxSpend = s.total_expenditure_crore;
    });
    return { project_count: maxCount, total_cost_crore: maxCost, total_expenditure_crore: maxSpend };
  }, [stateList]);

  function getStateData(geoName) {
    const key = normalizeStateName(geoName);
    return stateMap[key] || null;
  }

  function getStateColor(geoName) {
    const norm = normalizeStateName(geoName);
    const s = stateMap[norm];

    // 1. Colorful Multi-State Palette (Default vibrant atlas)
    if (selectedPalette === 'colorful') {
      const entry = STATE_COLORS[norm];
      if (entry) {
        return isDark ? entry.dark : entry.light;
      }
      return isDark ? '#1e293b' : '#e2e8f0';
    }

    // 2. Zonal Regions Palette
    if (selectedPalette === 'zonal') {
      const zone = getStateZone(geoName);
      if (zone) {
        return isDark ? zone.colorDark : zone.colorLight;
      }
      return isDark ? 'hsl(220 50% 50%)' : 'hsl(220 60% 60%)';
    }

    // 3. Progress Status Palette
    if (selectedPalette === 'progress' || selectedMetric === 'avg_progress') {
      return getProgressColor(s?.avg_progress, isDark);
    }

    if (!s || !s.project_count) {
      return isDark ? 'hsl(222 16% 18%)' : 'hsl(215 20% 92%)';
    }

    // 4. Metric Scaling (Spectrum or Monochrome)
    let metricVal = s.project_count;
    let maxVal = maxValues.project_count;
    if (selectedMetric === 'total_cost_crore') {
      metricVal = s.total_cost_crore;
      maxVal = maxValues.total_cost_crore;
    } else if (selectedMetric === 'total_expenditure_crore') {
      metricVal = s.total_expenditure_crore;
      maxVal = maxValues.total_expenditure_crore;
    }

    const ratio = Math.min(Math.max((metricVal || 0) / (maxVal || 1), 0.05), 1);

    if (selectedPalette === 'spectrum') {
      return getSpectrumColor(ratio, isDark);
    }

    // Monochrome Sapphire
    if (isDark) {
      return `hsl(218 90% ${28 + ratio * 36}%)`;
    } else {
      return `hsl(218 85% ${82 - ratio * 38}%)`;
    }
  }

  // Zoom & Pan Handlers
  const handleZoomIn = () => setZoom(z => Math.min(Number((z * 1.25).toFixed(2)), 4));
  const handleZoomOut = () => setZoom(z => Math.max(Number((z / 1.25).toFixed(2)), 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    // Only start pan on primary mouse click
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    // Only handle synthetic if it somehow fires, but we rely on native event below
    const delta = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(z => Math.min(Math.max(Number((z * delta).toFixed(2)), 0.5), 4));
  };

  useEffect(() => {
    const mapNode = mapContainerRef.current;
    if (!mapNode) return;
    const onNativeWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.15 : 0.85;
      setZoom(z => Math.min(Math.max(Number((z * delta).toFixed(2)), 0.5), 4));
    };
    mapNode.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => mapNode.removeEventListener('wheel', onNativeWheel);
  }, []);

  async function handleStateClick(geoName) {
    // Ignore click if user was actively dragging
    if (isDragging) return;
    const s = getStateData(geoName);
    const displayName = s ? s.state_name : geoName;
    setSelectedState(displayName);
    setLoadingProjects(true);
    setProjectSearch('');
    try {
      const params = { state: displayName, page_size: 20 };
      if (selectedSector) params.sector = selectedSector;
      if (selectedStatus) params.status = selectedStatus;
      const res = await projectsApi.list(params);
      setStateProjects(res.data.results || res.data || []);
    } catch {
      setStateProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }

  const selectedStateData = selectedState ? getStateData(selectedState) : null;

  // Filtered projects within state
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return stateProjects;
    const q = projectSearch.toLowerCase();
    return stateProjects.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.sector_name?.toLowerCase().includes(q) ||
      p.implementing_agency?.toLowerCase().includes(q)
    );
  }, [stateProjects, projectSearch]);

  // Sector breakdown of selected state projects (Dicing)
  const stateSectorSummary = useMemo(() => {
    const counts = {};
    stateProjects.forEach(p => {
      const sec = p.sector_name || 'Other';
      counts[sec] = (counts[sec] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [stateProjects]);

  return (
    <div className="page-body" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
      <Breadcrumbs />
      {/* Full Map Export Wrapper */}
      <div id="full-map-export-wrapper" style={{ padding: '4px', background: 'var(--bg-base)', borderRadius: 'var(--radius)' }}>
        {/* Slice & Dice Toolbar - Responsive */}
        <div className="card mb-sm map-slicer-bar">
          <div className="map-slicer-main">
            {/* Metric Slicer */}
            <div className="map-slicer-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>METRIC:</span>
                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm mobile-only"
                  onClick={() => setMobileFiltersOpen(prev => !prev)}
                  style={{ fontSize: '0.72rem', padding: '2px 8px', gap: '4px', alignItems: 'center', height: '26px' }}
                  aria-label="Toggle map filters"
                >
                  <SlidersHorizontal size={12} />
                  <span>Filters</span>
                  {(selectedSector || selectedStatus || selectedPalette !== 'colorful') && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                  )}
                  {mobileFiltersOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
              <div className="map-slicer-chips">
                <button type="button" className={`map-chip-btn${selectedMetric === 'project_count' ? ' active' : ''}`} onClick={() => setSelectedMetric('project_count')}>Projects</button>
                <button type="button" className={`map-chip-btn${selectedMetric === 'total_cost_crore' ? ' active' : ''}`} onClick={() => setSelectedMetric('total_cost_crore')}>Cost</button>
                <button type="button" className={`map-chip-btn${selectedMetric === 'total_expenditure_crore' ? ' active' : ''}`} onClick={() => setSelectedMetric('total_expenditure_crore')}>Spend</button>
                <button type="button" className={`map-chip-btn${selectedMetric === 'avg_progress' ? ' active' : ''}`} onClick={() => setSelectedMetric('avg_progress')}>Progress</button>
              </div>
            </div>

            {/* Color Palette Selector - Always visible on desktop, toggleable on mobile */}
            <div className={`map-slicer-section${!mobileFiltersOpen ? ' mobile-hidden' : ''}`}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>PALETTE:</span>
              <div className="map-slicer-chips">
                <button type="button" className={`map-chip-btn${selectedPalette === 'colorful' ? ' active' : ''}`} onClick={() => setSelectedPalette('colorful')}>🎨 Colorful</button>
                <button type="button" className={`map-chip-btn${selectedPalette === 'zonal' ? ' active' : ''}`} onClick={() => setSelectedPalette('zonal')}>🗺️ Zonal</button>
                <button type="button" className={`map-chip-btn${selectedPalette === 'spectrum' ? ' active' : ''}`} onClick={() => setSelectedPalette('spectrum')}>🌈 Heatmap</button>
                <button type="button" className={`map-chip-btn${selectedPalette === 'progress' ? ' active' : ''}`} onClick={() => setSelectedPalette('progress')}>🚦 Status</button>
                <button type="button" className={`map-chip-btn${selectedPalette === 'monochrome' ? ' active' : ''}`} onClick={() => setSelectedPalette('monochrome')}>💎 Classic</button>
              </div>
            </div>
          </div>

          {/* Sector & Status Slicers - Always visible on desktop, toggleable on mobile */}
          <div className={`map-slicer-selects${!mobileFiltersOpen ? ' mobile-hidden' : ''}`}>
            <select
              className="select-input"
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              style={{ padding: '4px 32px 4px 8px', fontSize: '0.75rem', height: '28px' }}
            >
              <option value="">All Sectors</option>
              {sectorList.map(s => (
                <option key={s.id || s.sector_id} value={s.id || s.sector_id}>{s.name || s.sector_name}</option>
              ))}
            </select>
            <select
              className="select-input"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ padding: '4px 32px 4px 8px', fontSize: '0.75rem', height: '28px' }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
        </div>

        {/* Main Grid: Map & Dice Panel */}
        <div
          className="map-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: selectedState ? '1.45fr 1fr' : '1fr',
            gap: 'var(--gap-lg)',
            alignItems: 'start'
          }}
        >
          {/* Map Container with Zoom Controls */}
          <div
            className="map-wrap"
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              height: 'calc(100vh - 145px)',
              maxHeight: 'calc(100vh - 145px)',
              minHeight: '440px',
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            {/* Export Button inside Map Container at Top Right */}
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 30, display: 'flex', gap: '8px' }}>
              <ExportButton targetId="full-map-export-wrapper" fileName="india_infrastructure_map" />
            </div>

            {/* Zoom Controls Floating Panel */}
            <div className="no-export" style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 6,
              boxShadow: 'var(--shadow)',
              backdropFilter: 'blur(8px)'
            }}>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={handleZoomIn}
                title="Zoom In (+)"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={handleResetZoom}
                title="Reset View"
                aria-label="Reset zoom and position"
              >
                <RotateCcw size={15} />
              </button>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textAlign: 'center',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border)',
                paddingTop: 4
              }}>
                {Math.round(zoom * 100)}%
              </div>
            </div>

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                center: [82.5, 21.2],
                scale: 930
              }}
              width={800}
              height={600}
              style={{ width: '100%', height: '100%', maxHeight: '100%' }}
              id="map-container-export"
            >
              <g
                id="map-zoom-group"
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                style={{
                  transformOrigin: '400px 300px',
                  transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)'
                }}
              >
                <MemoizedGeographies
                  indiaGeo={indiaGeo}
                  selectedState={selectedState}
                  handleStateClick={handleStateClick}
                  setTooltip={setTooltip}
                  getStateColor={getStateColor}
                  isDark={isDark}
                  stateMap={stateMap}
                  selectedMetric={selectedMetric}
                />
              </g>
            </ComposableMap>

            {/* Floating Hover Tooltip */}
            {tooltip && (
              <div style={{
                position: 'absolute',
                bottom: 14,
                left: 14,
                zIndex: 10,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                boxShadow: 'var(--shadow)',
                pointerEvents: 'none',
                transition: 'all 120ms ease'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} style={{ color: 'var(--accent)' }} />
                  {tooltip.data?.state_name || tooltip.name}
                </div>
                {tooltip.data ? (
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
                      {tooltip.data.project_count?.toLocaleString()} projects
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatCrore(tooltip.data.total_cost_crore)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                      {formatPercent(tooltip.data.avg_progress)}
                    </span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                    No standalone projects tracked under current filters
                  </div>
                )}
              </div>
            )}

            {/* Map Legend based on active palette */}
            <div style={{
              position: 'absolute',
              top: 14,
              left: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '8px 14px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow)',
              maxWidth: 360
            }}>
              {selectedPalette === 'colorful' ? (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--text-primary)' }}>
                    🎨 Vivid State Atlas Palette
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Distinct vibrant coloring, Click any state to drill down.
                  </div>
                </div>
              ) : selectedPalette === 'zonal' ? (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                    🗺️ Geographic Zones of India
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 12px' }}>
                    {Object.values(ZONES).map(z => (
                      <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: isDark ? z.colorDark : z.colorLight }} />
                        <span style={{ fontSize: '0.7rem' }}>{z.name.replace(' Zone', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedPalette === 'progress' || selectedMetric === 'avg_progress' ? (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                    🚦 Physical Progress Gauge
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'hsl(0 75% 55%)', fontWeight: 600 }}>● &lt;35%</span>
                    <span style={{ color: 'hsl(28 90% 55%)', fontWeight: 600 }}>● 35–55%</span>
                    <span style={{ color: 'hsl(45 95% 52%)', fontWeight: 600 }}>● 55–75%</span>
                    <span style={{ color: 'hsl(142 75% 48%)', fontWeight: 600 }}>● &ge;75%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                    {selectedPalette === 'spectrum' ? '🔥 Thermal Heatmap' : `${selectedMetric === 'project_count' ? 'Project Count' : selectedMetric === 'total_cost_crore' ? 'Total Cost (₹ Cr)' : 'Cumulative Spend (₹ Cr)'} Intensity`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Low</span>
                    {[0.05, 0.25, 0.5, 0.75, 0.95].map(t => (
                      <div
                        key={t}
                        style={{
                          width: 20,
                          height: 12,
                          borderRadius: 2,
                          background: selectedPalette === 'spectrum'
                            ? getSpectrumColor(t, isDark)
                            : isDark ? `hsl(218 90% ${28 + t * 36}%)` : `hsl(218 85% ${82 - t * 38}%)`
                        }}
                      />
                    ))}
                    <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>High</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected State Drilldown & Dicing Panel */}
          {selectedState && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)', height: 'calc(100vh - 145px)', maxHeight: 'calc(100vh - 145px)', minHeight: '440px', overflowY: 'auto' }}>
              {/* Summary Card */}
              <Card style={{ padding: 'var(--gap)' }}>
                <CardHeader
                  title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} style={{ color: 'var(--accent)' }} /> {selectedState}</span>}
                  subtitle={getStateZone(selectedState) && (
                    <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: '0.68rem', marginTop: '4px' }}>
                      {getStateZone(selectedState).name}
                    </span>
                  )}
                  action={
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setSelectedState(null)}
                      title="Close panel"
                    >
                      <X size={14} />
                    </button>
                  }
                />

                {selectedStateData ? (
                  <>
                    <div className="meta-grid" style={{ marginTop: 'var(--gap)' }}>
                      <div className="meta-item">
                        <div className="meta-label">Total Projects</div>
                        <div className="meta-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                          {selectedStateData.project_count?.toLocaleString()}
                        </div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Avg Physical Progress</div>
                        <div className="meta-value" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)' }}>
                          {formatPercent(selectedStateData.avg_progress)}
                        </div>
                      </div>
                      <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                        <div className="meta-label">Total Sanctioned / Revised Cost</div>
                        <div className="meta-value" style={{ fontWeight: 700 }}>
                          {formatCrore(selectedStateData.total_cost_crore)}
                        </div>
                      </div>
                      <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                        <div className="meta-label">Cumulative Expenditure to Date</div>
                        <div className="meta-value" style={{ fontWeight: 700 }}>
                          {formatCrore(selectedStateData.total_expenditure_crore)}
                        </div>
                      </div>
                    </div>

                    {/* Dice by Sector Chips */}
                    {stateSectorSummary.length > 0 && (
                      <div style={{ marginTop: 'var(--gap)', borderTop: '1px solid var(--border)', paddingTop: 'var(--gap-sm)' }}>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                          Sectors Active in {selectedState}:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {stateSectorSummary.slice(0, 6).map(([sec, count]) => (
                            <span
                              key={sec}
                              className="badge badge-sector"
                              style={{ cursor: 'pointer', fontSize: '0.72rem' }}
                              onClick={() => setProjectSearch(sec)}
                              title={`Filter projects by ${sec}`}
                            >
                              {sec}: <strong>{count}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ marginTop: 'var(--gap)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No standalone projects recorded exclusively under {selectedState} matching current filters.
                  </div>
                )}
              </Card>

              {/* State Projects Directory */}
              <div className="table-container" style={{ flex: 1, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                <div className="table-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 'var(--gap-sm)' }}>
                    <div className="table-title" style={{ fontSize: '0.88rem' }}>
                      Projects in {selectedState} ({filteredProjects.length})
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/projects?state=${encodeURIComponent(selectedState)}${selectedSector ? `&sector=${selectedSector}` : ''}`)}
                      style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    >
                      View in Explorer <ArrowRight size={12} style={{ marginLeft: 3 }} />
                    </button>
                  </div>

                  {/* Search within state projects */}
                  <div style={{ width: '100%', marginTop: 6 }}>
                    <div className="search-input-wrap">
                      <Search className="search-input-icon" size={13} />
                      <input
                        type="text"
                        className="search-input"
                        style={{ padding: '0.35rem 0.65rem 0.35rem 1.85rem', fontSize: '0.78rem' }}
                        placeholder="Search projects in state..."
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                      />
                      {projectSearch && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setProjectSearch('')}
                          style={{ position: 'absolute', right: 6, padding: 2 }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {loadingProjects ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ padding: 'var(--gap)' }}>
                      <div className="skeleton skeleton-text" style={{ width: '85%' }} />
                      <div className="skeleton skeleton-text" style={{ width: '50%', height: '0.7em' }} />
                    </div>
                  ))
                ) : filteredProjects.length > 0 ? (
                  <div style={{ flex: 1, minHeight: 200, overflowY: 'auto' }}>
                    {filteredProjects.map(p => (
                      <div
                        key={p.id}
                        style={{
                          padding: '10px var(--gap)',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'background var(--transition)'
                        }}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', marginBottom: 2, lineHeight: 1.3 }}>
                          {p.name}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--gap-sm)', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                          {p.sector_name && <span className="badge badge-sector">{p.sector_name}</span>}
                          {p.current_cost_crore && <span>{formatCrore(p.current_cost_crore)}</span>}
                          {p.current_progress != null && (
                            <span style={{ color: getProgressColor(p.current_progress, isDark), fontWeight: 700 }}>
                              · {p.current_progress}%
                            </span>
                          )}
                          {p.implementing_agency && <span>· {p.implementing_agency}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 'var(--gap-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    No projects match your filter.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
