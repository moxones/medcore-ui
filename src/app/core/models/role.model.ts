export type Role = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'ASSISTANT' | 'RECEPTIONIST' | 'PATIENT';

export const ROLE_REDIRECTS: Record<Role, string> = {
  SUPER_ADMIN:   '/admin/dashboard',
  CLINIC_ADMIN:  '/admin/dashboard',
  DOCTOR:        '/doctor/dashboard',
  ASSISTANT:     '/reception/dashboard',
  RECEPTIONIST:  '/reception/dashboard',
  PATIENT:       '/patient/dashboard',
};

const API_ROLE_MAP: Record<string, Role> = {
  SUPER_ADMIN:          'SUPER_ADMIN',
  'Super Admin':        'SUPER_ADMIN',
  CLINIC_ADMIN:         'CLINIC_ADMIN',
  ADMIN:                'CLINIC_ADMIN',
  'Clinic Admin':       'CLINIC_ADMIN',
  'Admin Clínica':      'CLINIC_ADMIN',
  Administrador:        'CLINIC_ADMIN',
  DOCTOR:               'DOCTOR',
  Doctor:               'DOCTOR',
  ASSISTANT:            'ASSISTANT',
  Assistant:            'ASSISTANT',
  Asistente:            'ASSISTANT',
  RECEPTIONIST:         'RECEPTIONIST',
  Receptionist:         'RECEPTIONIST',
  Recepcionista:        'RECEPTIONIST',
  PATIENT:              'PATIENT',
  Patient:              'PATIENT',
  Paciente:             'PATIENT',
};

export function normalizeRole(apiRole: string): Role | null {
  return API_ROLE_MAP[apiRole] ?? null;
}
