import { Role } from '@core/models/role.model';
import { ReportAccent, ReportCatalog, ReportDefinition } from '@core/models/report.model';

export const REPORTS_BASE_PATH: Record<Role, string> = {
  SUPER_ADMIN: '/admin/reports',
  CLINIC_ADMIN: '/admin/reports',
  DOCTOR: '/doctor/reports',
  ASSISTANT: '/assistant/reports',
  RECEPTIONIST: '/reception/reports',
  PATIENT: '/patient/reports',
};

export const REPORTS_ACCENT: Record<Role, ReportAccent> = {
  SUPER_ADMIN: 'primary',
  CLINIC_ADMIN: 'primary',
  DOCTOR: 'doctor',
  ASSISTANT: 'assistant',
  RECEPTIONIST: 'primary',
  PATIENT: 'primary',
};

export const REPORTS_TITLE: Record<Role, string> = {
  SUPER_ADMIN: 'Reportes de Plataforma',
  CLINIC_ADMIN: 'Reportes de la Clínica',
  DOCTOR: 'Mis Reportes',
  ASSISTANT: 'Reportes de Triaje',
  RECEPTIONIST: 'Reportes de Recepción',
  PATIENT: 'Mis Reportes',
};

export const REPORTS_SUBTITLE: Record<Role, string> = {
  SUPER_ADMIN: 'Crecimiento, ingresos y uso de todas las organizaciones de la plataforma.',
  CLINIC_ADMIN: 'Finanzas, productividad y operación de tu clínica en un solo lugar.',
  DOCTOR: 'Tu actividad clínica, diagnósticos y prescripciones a lo largo del tiempo.',
  ASSISTANT: 'Volumen de triajes, prioridades y tiempos de espera en sala.',
  RECEPTIONIST: 'Citas, ausencias y cobros del front desk por periodo y sucursal.',
  PATIENT: 'Tu historial de atención, recetas y evolución de salud.',
};

export const REPORT_CATALOG: ReportCatalog = {
  SUPER_ADMIN: [
    {
      key: 'platform-organizations',
      slug: 'organizaciones',
      icon: 'corporate_fare',
      title: 'Organizaciones y Crecimiento',
      description: 'Tenants activos, altas, bajas y retención por periodo.',
      filters: ['dateRange'],
    },
    {
      key: 'platform-subscription-revenue',
      slug: 'ingresos-suscripciones',
      icon: 'payments',
      title: 'Ingresos por Suscripciones',
      description: 'MRR, ingreso por plan, churn y proyección de ingresos recurrentes.',
      filters: ['dateRange'],
    },
    {
      key: 'platform-usage',
      slug: 'uso-plataforma',
      icon: 'insights',
      title: 'Uso de la Plataforma',
      description: 'Usuarios activos, citas creadas y actividad por organización.',
      filters: ['dateRange'],
    },
    {
      key: 'platform-subscription-status',
      slug: 'estado-suscripciones',
      icon: 'card_membership',
      title: 'Estado de Suscripciones',
      description: 'Vencimientos próximos, trials, morosidad y planes activos.',
      filters: ['status'],
    },
  ],
  CLINIC_ADMIN: [
    {
      key: 'clinic-financial-summary',
      slug: 'resumen-financiero',
      icon: 'account_balance_wallet',
      title: 'Resumen Financiero',
      description: 'Ingresos por periodo, por sucursal y por método de pago.',
      filters: ['dateRange', 'branch'],
    },
    {
      key: 'clinic-appointments-analysis',
      slug: 'analisis-citas',
      icon: 'event_note',
      title: 'Análisis de Citas',
      description: 'Volumen por estado, tasa de no-show y cancelaciones.',
      filters: ['dateRange', 'branch', 'status'],
    },
    {
      key: 'clinic-doctor-productivity',
      slug: 'productividad-medica',
      icon: 'medical_services',
      title: 'Productividad Médica',
      description: 'Citas atendidas, tiempo promedio e ingresos por médico.',
      filters: ['dateRange', 'branch', 'doctor'],
    },
    {
      key: 'clinic-patient-insights',
      slug: 'analisis-pacientes',
      icon: 'groups',
      title: 'Análisis de Pacientes',
      description: 'Nuevos vs recurrentes, demografía y procedencia.',
      filters: ['dateRange', 'branch'],
    },
    {
      key: 'clinic-branch-utilization',
      slug: 'ocupacion-agenda',
      icon: 'business',
      title: 'Ocupación de Agenda',
      description: 'Utilización de horarios y capacidad por sucursal.',
      filters: ['dateRange', 'branch'],
    },
  ],
  DOCTOR: [
    {
      key: 'doctor-productivity',
      slug: 'mi-productividad',
      icon: 'insights',
      title: 'Mi Productividad',
      description: 'Consultas atendidas, tiempo promedio y ausencias.',
      filters: ['dateRange'],
    },
    {
      key: 'doctor-diagnoses',
      slug: 'diagnosticos-frecuentes',
      icon: 'coronavirus',
      title: 'Diagnósticos Frecuentes',
      description: 'Top de diagnósticos CIE-10 registrados en tus consultas.',
      filters: ['dateRange'],
    },
    {
      key: 'doctor-prescriptions',
      slug: 'recetas-ordenes',
      icon: 'prescriptions',
      title: 'Recetas y Órdenes Emitidas',
      description: 'Medicamentos prescritos y órdenes de exámenes generadas.',
      filters: ['dateRange'],
    },
  ],
  RECEPTIONIST: [
    {
      key: 'reception-daily-appointments',
      slug: 'citas-por-dia',
      icon: 'today',
      title: 'Citas por Día',
      description: 'Agendadas vs atendidas y distribución por estado.',
      filters: ['dateRange', 'branch'],
    },
    {
      key: 'reception-cancellations',
      slug: 'ausencias-cancelaciones',
      icon: 'event_busy',
      title: 'Ausencias y Cancelaciones',
      description: 'Tasa de no-show y cancelaciones por periodo.',
      filters: ['dateRange', 'branch'],
    },
    {
      key: 'reception-cash-summary',
      slug: 'resumen-cobros',
      icon: 'point_of_sale',
      title: 'Resumen de Cobros',
      description: 'Cobros del periodo por método de pago y sucursal.',
      filters: ['dateRange', 'branch'],
    },
  ],
  ASSISTANT: [
    {
      key: 'assistant-triage-summary',
      slug: 'resumen-triaje',
      icon: 'monitor_heart',
      title: 'Resumen de Triaje',
      description: 'Triajes realizados y distribución por prioridad.',
      filters: ['dateRange', 'branch'],
    },
    {
      key: 'assistant-waiting-times',
      slug: 'tiempos-espera',
      icon: 'timer',
      title: 'Tiempos de Espera',
      description: 'Espera promedio en sala y por franja horaria.',
      filters: ['dateRange', 'branch'],
    },
  ],
  PATIENT: [
    {
      key: 'patient-appointment-history',
      slug: 'historial-citas',
      icon: 'event_available',
      title: 'Mi Historial de Citas',
      description: 'Tus citas pasadas, médicos atendidos y especialidades.',
      filters: ['dateRange'],
    },
    {
      key: 'patient-prescriptions',
      slug: 'mis-recetas',
      icon: 'medication',
      title: 'Mis Recetas',
      description: 'Medicamentos prescritos e indicaciones por consulta.',
      filters: ['dateRange'],
    },
    {
      key: 'patient-health-summary',
      slug: 'resumen-salud',
      icon: 'favorite',
      title: 'Resumen de Salud',
      description: 'Evolución de tus signos vitales y mediciones clave.',
      filters: ['dateRange'],
    },
  ],
};

export function findReportBySlug(role: Role, slug: string): ReportDefinition | undefined {
  return REPORT_CATALOG[role].find((report) => report.slug === slug);
}
