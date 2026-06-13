import { environment } from '../../../environments/environment';

export const API_BASE = `${environment.apiUrl}/api`;

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
    myAppointments: `${API_BASE}/patients/me/appointments`,
    byId: (id: number) => `${API_BASE}/patients/${id}`,
    clinicalHistory: (patientId: number) => `${API_BASE}/patients/${patientId}/clinical-history`,
    allergies: (patientId: number) => `${API_BASE}/patients/${patientId}/allergies`,
    allergyById: (patientId: number, itemId: number) =>
      `${API_BASE}/patients/${patientId}/allergies/${itemId}`,
    conditions: (patientId: number) => `${API_BASE}/patients/${patientId}/conditions`,
    conditionById: (patientId: number, itemId: number) =>
      `${API_BASE}/patients/${patientId}/conditions/${itemId}`,
    familyHistory: (patientId: number) => `${API_BASE}/patients/${patientId}/family-history`,
    familyHistoryById: (patientId: number, itemId: number) =>
      `${API_BASE}/patients/${patientId}/family-history/${itemId}`,
    surgicalHistory: (patientId: number) => `${API_BASE}/patients/${patientId}/surgical-history`,
    surgicalHistoryById: (patientId: number, itemId: number) =>
      `${API_BASE}/patients/${patientId}/surgical-history/${itemId}`,
    habits: (patientId: number) => `${API_BASE}/patients/${patientId}/habits`,
    habitById: (patientId: number, itemId: number) =>
      `${API_BASE}/patients/${patientId}/habits/${itemId}`,
  },
  users: {
    base: `${API_BASE}/users`,
    byId: (id: number) => `${API_BASE}/users/${id}`,
    status: (id: number) => `${API_BASE}/users/${id}/status`,
    roles: (id: number) => `${API_BASE}/users/${id}/roles`,
    branches: (userId: number) => `${API_BASE}/users/${userId}/branches`,
    branchLink: (userId: number, branchId: number) => `${API_BASE}/users/${userId}/branches/${branchId}`,
  },
  profile: {
    password: `${API_BASE}/profile/password`,
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
    checkEmail: `${API_BASE}/public/patients/check-email`,
    registerPatient: `${API_BASE}/public/patients/register`,
  },
  appointments: {
    base: `${API_BASE}/appointments`,
    calendar: `${API_BASE}/appointments/calendar`,
    queue: `${API_BASE}/appointments/queue`,
    availableSlots: `${API_BASE}/appointments/available-slots`,
    availability: `${API_BASE}/appointments/availability`,
    specialtiesSummary: `${API_BASE}/appointments/specialties-summary`,
    byId: (id: number) => `${API_BASE}/appointments/${id}`,
    reschedule: (id: number) => `${API_BASE}/appointments/${id}/reschedule`,
    flowStatus: (id: number) => `${API_BASE}/appointments/${id}/flow-status`,
    cancel: (id: number) => `${API_BASE}/appointments/${id}/cancel`,
    payments: (id: number) => `${API_BASE}/appointments/${id}/payments`,
  },
  dashboard: {
    summary: `${API_BASE}/dashboard/summary`,
    productivity: `${API_BASE}/dashboard/productivity`,
    doctorSummary: `${API_BASE}/dashboard/doctor-summary`,
  },
  superAdminDashboard: {
    summary: `${API_BASE}/super-admin/dashboard/summary`,
    tenants: `${API_BASE}/super-admin/dashboard/tenants`,
  },
  superAdmin: {
    users: `${API_BASE}/super-admin/users`,
    userById: (id: number) => `${API_BASE}/super-admin/users/${id}`,
    userPassword: (id: number) => `${API_BASE}/super-admin/users/${id}/password`,
    catalogs: {
      specialties: `${API_BASE}/super-admin/catalogs/specialties`,
      specialtyById: (id: number) => `${API_BASE}/super-admin/catalogs/specialties/${id}`,
      appointmentTypes: `${API_BASE}/super-admin/catalogs/appointment-types`,
      appointmentTypeById: (id: number) => `${API_BASE}/super-admin/catalogs/appointment-types/${id}`,
      documentTypes: `${API_BASE}/super-admin/catalogs/document-types`,
      documentTypeById: (id: number) => `${API_BASE}/super-admin/catalogs/document-types/${id}`,
      plans: `${API_BASE}/super-admin/catalogs/plans`,
      planById: (id: number) => `${API_BASE}/super-admin/catalogs/plans/${id}`,
      subscriptionStatuses: `${API_BASE}/super-admin/catalogs/subscription-statuses`,
      subscriptionStatusById: (id: number) => `${API_BASE}/super-admin/catalogs/subscription-statuses/${id}`,
      appointmentStatuses: `${API_BASE}/super-admin/catalogs/appointment-statuses`,
      appointmentStatusById: (id: number) => `${API_BASE}/super-admin/catalogs/appointment-statuses/${id}`,
    },
  },
  processConfig: {
    base: `${API_BASE}/process-config`,
  },
  triage: {
    base: `${API_BASE}/triage`,
    today: `${API_BASE}/triage/today`,
    byId: (id: number) => `${API_BASE}/triage/${id}`,
    byAppointment: (appointmentId: number) => `${API_BASE}/triage/appointment/${appointmentId}`,
    latestByAppointment: (appointmentId: number) =>
      `${API_BASE}/triage/appointment/${appointmentId}/latest`,
    byPatient: (patientId: number) => `${API_BASE}/triage/patient/${patientId}`,
  },
  cie10: {
    base: `${API_BASE}/cie10`,
  },
  auditLog: {
    base: `${API_BASE}/audit-log`,
  },
  branches: {
    base: `${API_BASE}/branches`,
    byId: (id: number) => `${API_BASE}/branches/${id}`,
    doctors: (branchId: number) => `${API_BASE}/branches/${branchId}/doctors`,
  },
  doctors: {
    base: `${API_BASE}/doctors`,
    me: `${API_BASE}/doctors/me`,
    meProfile: `${API_BASE}/doctors/me/profile`,
    mePatients: `${API_BASE}/doctors/me/patients`,
    mePrescriptions: `${API_BASE}/doctors/me/prescriptions`,
    meOrders: `${API_BASE}/doctors/me/orders`,
    meTemplates: `${API_BASE}/doctors/me/templates`,
    meTemplateById: (id: number) => `${API_BASE}/doctors/me/templates/${id}`,
    byId: (id: number) => `${API_BASE}/doctors/${id}`,
    specialties: (doctorId: number) => `${API_BASE}/doctors/${doctorId}/specialties`,
    specialtiesAvailable: (doctorId: number) =>
      `${API_BASE}/doctors/${doctorId}/specialties/available`,
    specialtiesBulk: (doctorId: number) =>
      `${API_BASE}/doctors/${doctorId}/specialties/bulk`,
    specialtyLink: (doctorId: number, specialtyId: number) =>
      `${API_BASE}/doctors/${doctorId}/specialties/${specialtyId}`,
    branches: (doctorId: number) => `${API_BASE}/doctors/${doctorId}/branches`,
    branchesBulk: (doctorId: number) => `${API_BASE}/doctors/${doctorId}/branches/bulk`,
    branchLink: (doctorId: number, branchId: number) =>
      `${API_BASE}/doctors/${doctorId}/branches/${branchId}`,
    schedules: (doctorId: number) => `${API_BASE}/doctors/${doctorId}/schedules`,
    scheduleById: (doctorId: number, scheduleId: number) =>
      `${API_BASE}/doctors/${doctorId}/schedules/${scheduleId}`,
  },
  catalogs: {
    specialties: `${API_BASE}/catalogs/specialties`,
    specialtiesAvailable: `${API_BASE}/catalogs/specialties/available`,
    specialtyLink: (id: number) => `${API_BASE}/catalogs/specialties/${id}`,
    appointmentTypes: `${API_BASE}/catalogs/appointment-types`,
    appointmentTypesAvailable: `${API_BASE}/catalogs/appointment-types/available`,
    appointmentTypeLink: (id: number) => `${API_BASE}/catalogs/appointment-types/${id}`,
    documentTypes: `${API_BASE}/catalogs/document-types`,
    documentTypesAvailable: `${API_BASE}/catalogs/document-types/available`,
    documentTypeLink: (id: number) => `${API_BASE}/catalogs/document-types/${id}`,
    plans: `${API_BASE}/catalogs/plans`,
    subscriptionStatuses: `${API_BASE}/catalogs/subscription-statuses`,
    appointmentStatuses: `${API_BASE}/catalogs/appointment-statuses`,
  },
  subscriptions: {
    base: `${API_BASE}/subscriptions`,
    byId: (id: number) => `${API_BASE}/subscriptions/${id}`,
  },
  reports: {
    data: (key: string) => `${API_BASE}/reports/${key}`,
    export: (key: string) => `${API_BASE}/reports/${key}/export`,
  },
  medicalRecords: {
    base: `${API_BASE}/medical-records`,
    me: `${API_BASE}/medical-records/me`,
    entries: `${API_BASE}/medical-records/entries`,
    byPatient: (patientId: number) => `${API_BASE}/medical-records/patient/${patientId}`,
    clinical: (patientId: number) => `${API_BASE}/medical-records/patient/${patientId}/clinical`,
    entryById: (entryId: number) => `${API_BASE}/medical-records/entries/${entryId}`,
    signEntry: (entryId: number) => `${API_BASE}/medical-records/entries/${entryId}/sign`,
    orderResults: (orderId: number) => `${API_BASE}/medical-records/orders/${orderId}/results`,
    byAppointment: (appointmentId: number) =>
      `${API_BASE}/medical-records/appointment/${appointmentId}/entries`,
  },
} as const;
