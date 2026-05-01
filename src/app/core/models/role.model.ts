export type Role = 'SUPERADMIN' | 'ADMIN' | 'USER' | 'PATIENT';

export const ROLE_REDIRECTS: Record<Role, string> = {
  SUPERADMIN: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  USER: '/reception/dashboard',
  PATIENT: '/patient/dashboard',
};

const API_ROLE_MAP: Record<string, Role> = {
  SUPER_ADMIN: 'SUPERADMIN',
  'Super Admin': 'SUPERADMIN',
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  Admin: 'ADMIN',
  USER: 'USER',
  User: 'USER',
  PATIENT: 'PATIENT',
  Patient: 'PATIENT',
};

export function normalizeRole(apiRole: string): Role | null {
  return API_ROLE_MAP[apiRole] ?? null;
}
