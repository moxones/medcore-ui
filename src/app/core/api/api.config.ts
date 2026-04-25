import { environment } from '../../../environments/environment';

export const API_BASE = environment.apiUrl;

export const API_ROUTES = {
  auth: {
    login: `${API_BASE}/auth/login`,
    register: `${API_BASE}/auth/register`,
    refresh: `${API_BASE}/auth/refresh`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
  },
  patients: {
    base: `${API_BASE}/patients`,
    profile: `${API_BASE}/patients/profile`,
    search: `${API_BASE}/patients/search`,
    byId: (id: number) => `${API_BASE}/patients/${id}`,
  },
  users: {
    base: `${API_BASE}/users`,
    byId: (id: number) => `${API_BASE}/users/${id}`,
    status: (id: number) => `${API_BASE}/users/${id}/status`,
  },
  tenant: {
    info: `${API_BASE}/public/tenant-info`,
  },
} as const;
