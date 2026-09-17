import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Projects ────────────────────────────────────────────────
export const projectsApi = {
  list: (params) => api.get('/projects/', { params }),
  detail: (id) => api.get(`/projects/${id}/`),
  history: (id) => api.get(`/projects/${id}/history/`),
  changes: (id) => api.get(`/projects/${id}/changes/`),
  compare: (ids) => api.post('/projects/compare/', { ids }),
};

// ── Analytics ────────────────────────────────────────────────
export const analyticsApi = {
  overview: () => api.get('/analytics/overview/'),
  states: () => api.get('/analytics/states/'),
  sectors: () => api.get('/analytics/sectors/'),
  ministries: () => api.get('/analytics/ministries/'),
  costs: () => api.get('/analytics/costs/'),
  progress: () => api.get('/analytics/progress/'),
  years: () => api.get('/analytics/years/'),
};

// ── Reference Data ───────────────────────────────────────────
export const refApi = {
  states: () => api.get('/locations/states/'),
  sectors: () => api.get('/organizations/sectors/'),
  ministries: () => api.get('/organizations/ministries/'),
  sources: () => api.get('/sources/'),
  ingestionRuns: (params) => api.get('/ingestion/runs/', { params }),
  qualityIssues: (params) => api.get('/ingestion/quality/', { params }),
  resolveIssue: (id, data) => api.patch(`/ingestion/quality/${id}/resolve/`, data),
  triggerIngestion: (sourceId) => api.post(`/sources/${sourceId}/trigger/`),
};

export default api;
