import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SUPER_ADMIN', 'CLINIC_ADMIN'] },
    loadComponent: () =>
      import('./layout/shells/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'appointments',
        canActivate: [roleGuard],
        data: { roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/appointments/appointments-page.component').then(
            (m) => m.AppointmentsPageComponent,
          ),
      },
      {
        path: 'patients',
        canActivate: [roleGuard],
        data: { roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/patients/patients-page.component').then(
            (m) => m.PatientsPageComponent,
          ),
      },
      {
        path: 'medical-records',
        canActivate: [roleGuard],
        data: { roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/medical-records/medical-records-page.component').then(
            (m) => m.MedicalRecordsPageComponent,
          ),
      },
      {
        path: 'doctors',
        canActivate: [roleGuard],
        data: { roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/doctors/doctors-page.component').then(
            (m) => m.DoctorsPageComponent,
          ),
      },
      {
        path: 'branches',
        loadComponent: () =>
          import('./features/admin/branches/branches-page.component').then(
            (m) => m.BranchesPageComponent,
          ),
      },
      {
        path: 'catalogs',
        canActivate: [roleGuard],
        data: { roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/catalogs/catalogs-page.component').then(
            (m) => m.CatalogsPageComponent,
          ),
      },
      {
        path: 'catalog-master',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/catalog-master/catalog-master-page.component').then(
            (m) => m.CatalogMasterPageComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users-page.component').then(
            (m) => m.UsersPageComponent,
          ),
      },
      {
        path: 'staff-branches',
        canActivate: [roleGuard],
        data: { roles: ['CLINIC_ADMIN', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/staff-branches/staff-branches-page.component').then(
            (m) => m.StaffBranchesPageComponent,
          ),
      },
      {
        path: 'organizations',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/organizations/organizations-page.component').then(
            (m) => m.OrganizationsPageComponent,
          ),
      },
      {
        path: 'subscriptions',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/subscriptions/subscriptions-page.component').then(
            (m) => m.SubscriptionsPageComponent,
          ),
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/reports/reports-hub.component').then(
                (m) => m.ReportsHubPageComponent,
              ),
          },
          {
            path: ':slug',
            loadComponent: () =>
              import('./features/reports/report-view.component').then(
                (m) => m.ReportViewPageComponent,
              ),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'reception',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['RECEPTIONIST'] },
    loadComponent: () =>
      import('./layout/shells/reception-shell/reception-shell.component').then(
        (m) => m.ReceptionShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/reception/dashboard/reception-dashboard.component').then(
            (m) => m.ReceptionDashboardComponent,
          ),
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./features/reception/agenda/agenda-page.component').then(
            (m) => m.AgendaPageComponent,
          ),
      },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/reception/queue/queue-page.component').then(
            (m) => m.QueuePageComponent,
          ),
      },
      {
        path: 'appointments/new',
        loadComponent: () =>
          import('./features/reception/new-appointment/new-appointment-page.component').then(
            (m) => m.NewAppointmentPageComponent,
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/reception/patients/patients-page.component').then(
            (m) => m.ReceptionPatientsPageComponent,
          ),
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/reports/reports-hub.component').then(
                (m) => m.ReportsHubPageComponent,
              ),
          },
          {
            path: ':slug',
            loadComponent: () =>
              import('./features/reports/report-view.component').then(
                (m) => m.ReportViewPageComponent,
              ),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'assistant',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ASSISTANT'] },
    loadComponent: () =>
      import('./layout/shells/assistant-shell/assistant-shell.component').then(
        (m) => m.AssistantShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/assistant/dashboard/assistant-dashboard.component').then(
            (m) => m.AssistantDashboardComponent,
          ),
      },
      {
        path: 'triage',
        loadComponent: () =>
          import('./features/assistant/triage-queue/triage-queue.component').then(
            (m) => m.TriageQueueComponent,
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/assistant/history/triage-history.component').then(
            (m) => m.TriageHistoryComponent,
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/assistant/patients/assistant-patients.component').then(
            (m) => m.AssistantPatientsComponent,
          ),
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/reports/reports-hub.component').then(
                (m) => m.ReportsHubPageComponent,
              ),
          },
          {
            path: ':slug',
            loadComponent: () =>
              import('./features/reports/report-view.component').then(
                (m) => m.ReportViewPageComponent,
              ),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'doctor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DOCTOR'] },
    loadComponent: () =>
      import('./layout/shells/doctor-shell/doctor-shell.component').then(
        (m) => m.DoctorShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/doctor/dashboard/doctor-dashboard.component').then(
            (m) => m.DoctorDashboardComponent,
          ),
      },
      {
        path: 'today',
        loadComponent: () =>
          import('./features/doctor/today/doctor-today.component').then(
            (m) => m.DoctorTodayComponent,
          ),
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./features/doctor/schedule/doctor-schedule.component').then(
            (m) => m.DoctorScheduleComponent,
          ),
      },
      {
        path: 'consultation',
        loadComponent: () =>
          import('./features/doctor/consultation/doctor-consultation.component').then(
            (m) => m.DoctorConsultationComponent,
          ),
      },
      {
        path: 'medical-records',
        loadComponent: () =>
          import('./features/doctor/medical-records/doctor-medical-records.component').then(
            (m) => m.DoctorMedicalRecordsComponent,
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/doctor/patients/doctor-patients.component').then(
            (m) => m.DoctorPatientsComponent,
          ),
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./features/doctor/availability/doctor-availability.component').then(
            (m) => m.DoctorAvailabilityComponent,
          ),
      },
      {
        path: 'prescriptions',
        loadComponent: () =>
          import('./features/doctor/prescriptions/doctor-prescriptions.component').then(
            (m) => m.DoctorPrescriptionsComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/doctor/orders/doctor-orders.component').then(
            (m) => m.DoctorOrdersComponent,
          ),
      },
      {
        path: 'templates',
        loadComponent: () =>
          import('./features/doctor/templates/doctor-templates.component').then(
            (m) => m.DoctorTemplatesComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/doctor/profile/doctor-profile.component').then(
            (m) => m.DoctorProfileComponent,
          ),
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/reports/reports-hub.component').then(
                (m) => m.ReportsHubPageComponent,
              ),
          },
          {
            path: ':slug',
            loadComponent: () =>
              import('./features/reports/report-view.component').then(
                (m) => m.ReportViewPageComponent,
              ),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'patient',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PATIENT'] },
    loadComponent: () =>
      import('./layout/shells/patient-shell/patient-shell.component').then(
        (m) => m.PatientShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/patient/dashboard/patient-dashboard.component').then(
            (m) => m.PatientDashboardComponent,
          ),
      },
      {
        path: 'appointments',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/patient/appointments/patient-appointments.component').then(
                (m) => m.PatientAppointmentsComponent,
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/patient/appointments/patient-new-appointment.component').then(
                (m) => m.PatientNewAppointmentComponent,
              ),
          },
        ],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/patient/profile/patient-profile.component').then(
            (m) => m.PatientProfileComponent,
          ),
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/reports/reports-hub.component').then(
                (m) => m.ReportsHubPageComponent,
              ),
          },
          {
            path: ':slug',
            loadComponent: () =>
              import('./features/reports/report-view.component').then(
                (m) => m.ReportViewPageComponent,
              ),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
