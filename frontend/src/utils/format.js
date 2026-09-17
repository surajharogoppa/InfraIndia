// ── Currency formatting ──────────────────────────────────────
export function formatCrore(value) {
  if (value == null) return '—';
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
}

export function formatCroreExact(value) {
  if (value == null) return '—';
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
}

// ── Date formatting ──────────────────────────────────────────
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function formatYear(value) {
  if (!value) return '—';
  return new Date(value).getFullYear().toString();
}

// ── Progress ─────────────────────────────────────────────────
export function progressClass(pct) {
  if (pct == null) return '';
  if (pct >= 75) return 'high';
  if (pct >= 40) return 'medium';
  return 'low';
}

// ── Platform status badge ────────────────────────────────────
export function statusBadgeClass(status) {
  const map = {
    ACTIVE: 'badge-active',
    COMPLETED: 'badge-completed',
    PLANNED: 'badge-planned',
    UNKNOWN: 'badge-unknown',
    CLOSED: 'badge-closed',
  };
  return map[status] || 'badge-unknown';
}

export function statusLabel(status) {
  const map = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    PLANNED: 'Planned',
    UNKNOWN: 'Unknown',
    CLOSED: 'Closed',
  };
  return map[status] || status || '—';
}

// ── Numbers ──────────────────────────────────────────────────
export function formatNumber(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

export function formatPercent(n, decimals = 1) {
  if (n == null) return '—';
  return `${Number(n).toFixed(decimals)}%`;
}

// ── Change type label ────────────────────────────────────────
export function changeTypeLabel(type) {
  const map = {
    COST_CHANGED: 'Cost Changed',
    PROGRESS_CHANGED: 'Progress Changed',
    EXPENDITURE_CHANGED: 'Expenditure Changed',
    COMPLETION_DATE_CHANGED: 'Completion Date Changed',
    START_DATE_CHANGED: 'Start Date Changed',
    STATUS_CHANGED: 'Status Changed',
    OTHER_FIELD_CHANGED: 'Field Changed',
  };
  return map[type] || type;
}

// ── Sector color ─────────────────────────────────────────────
const SECTOR_COLORS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#14b8a6',
  '#ef4444', '#f97316', '#6366f1', '#ec4899', '#84cc16',
];
export function sectorColor(index) {
  return SECTOR_COLORS[index % SECTOR_COLORS.length];
}
