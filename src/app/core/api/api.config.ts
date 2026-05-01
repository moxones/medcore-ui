import { environment } from '../../../environments/environment';

export const API_BASE = environment.apiUrl;

export const API_ROUTES = {
  auth: {
    login: `${API_BASE}/auth/login`,
    register: `${API_BASE}/auth/register`,
    refresh: `${API_BASE}/auth/refresh`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
    changePassword: `${API_BASE}/auth/change-password`,
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
  organizations: {
    base: `${API_BASE}/tenants`,
    byId: (id: number) => `${API_BASE}/tenants/${id}`,
  },
  public: {
    booking: `${API_BASE}/public/bookings`,
  },
  appointments: {
    base: `${API_BASE}/appointments`,
    calendar: `${API_BASE}/appointments/calendar`,
    availableSlots: `${API_BASE}/appointments/available-slots`,
    byId: (id: number) => `${API_BASE}/appointments/${id}`,
    reschedule: (id: number) => `${API_BASE}/appointments/${id}/reschedule`,
    flowStatus: (id: number) => `${API_BASE}/appointments/${id}/flow-status`,
    cancel: (id: number) => `${API_BASE}/appointments/${id}/cancel`,
  },
  dashboard: {
    summary: `${API_BASE}/dashboard/summary`,
    productivity: `${API_BASE}/dashboard/productivity`,
  },
  superAdminDashboard: {
    summary: `${API_BASE}/super-admin/dashboard/summary`,
    tenants: `${API_BASE}/super-admin/dashboard/tenants`,
  },
  triage: {
    base: `${API_BASE}/triage`,
    byAppointment: (appointmentId: number) => `${API_BASE}/triage/appointment/${appointmentId}`,
  },
  branches: {
    base: `${API_BASE}/branches`,
    byId: (id: number) => `${API_BASE}/branches/${id}`,
  },
  doctors: {
    base: `${API_BASE}/doctors`,
    byId: (id: number) => `${API_BASE}/doctors/${id}`,
  },
  catalogs: {
    specialties: `${API_BASE}/catalogs/specialties`,
    specialtyById: (id: number) => `${API_BASE}/catalogs/specialties/${id}`,
    plans: `${API_BASE}/catalogs/plans`,
    planById: (id: number) => `${API_BASE}/catalogs/plans/${id}`,
    documentTypes: `${API_BASE}/catalogs/document-types`,
    documentTypeById: (id: number) => `${API_BASE}/catalogs/document-types/${id}`,
    subscriptionStatuses: `${API_BASE}/catalogs/subscription-statuses`,
    subscriptionStatusById: (id: number) => `${API_BASE}/catalogs/subscription-statuses/${id}`,
    appointmentStatuses: `${API_BASE}/catalogs/appointment-statuses`,
    appointmentStatusById: (id: number) => `${API_BASE}/catalogs/appointment-statuses/${id}`,
    appointmentTypes: `${API_BASE}/catalogs/appointment-types`,
    appointmentTypeById: (id: number) => `${API_BASE}/catalogs/appointment-types/${id}`,
  },
  subscriptions: {
    base: `${API_BASE}/subscriptions`,
    byId: (id: number) => `${API_BASE}/subscriptions/${id}`,
  },
  medicalRecords: {
    base: `${API_BASE}/medical-records`,
    byPatient: (patientId: number) => `${API_BASE}/medical-records/patient/${patientId}`,
  },
} as const;
