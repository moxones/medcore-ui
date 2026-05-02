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
        loadComponent: () =>
          import('./features/admin/catalogs/catalogs-page.component').then(
            (m) => m.CatalogsPageComponent,
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'reception',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ASSISTANT', 'RECEPTIONIST'] },
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
