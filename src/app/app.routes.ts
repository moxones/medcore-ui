import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
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
        loadComponent: () =>
          import('./features/admin/appointments/appointments-page.component').then(
            (m) => m.AppointmentsPageComponent,
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/admin/patients/patients-page.component').then(
            (m) => m.PatientsPageComponent,
          ),
      },
      {
        path: 'medical-records',
        loadComponent: () =>
          import('./features/admin/medical-records/medical-records-page.component').then(
            (m) => m.MedicalRecordsPageComponent,
          ),
      },
      {
        path: 'doctors',
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
        loadComponent: () =>
          import('./features/admin/organizations/organizations-page.component').then(
            (m) => m.OrganizationsPageComponent,
          ),
      },
      {
        path: 'subscriptions',
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
    path: 'patient',
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
