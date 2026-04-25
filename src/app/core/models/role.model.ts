export type Role = 'SUPERADMIN' | 'ADMIN' | 'USER' | 'PATIENT';

export const ROLE_REDIRECTS: Record<Role, string> = {
  SUPERADMIN: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  USER: '/reception/dashboard',
  PATIENT: '/patient/dashboard',
};
