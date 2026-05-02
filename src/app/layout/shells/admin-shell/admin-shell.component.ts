import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { ChangePasswordDialogComponent } from '@shared/dialogs/change-password/change-password-dialog.component';
import { LogoutOverlayComponent } from '@shared/components/logout-overlay/logout-overlay.component';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatDialogModule,
    LogoutOverlayComponent,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  @ViewChild('sidenav') private readonly sidenav!: MatSidenav;

  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);

  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);

  readonly isHandset = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly sidenavMode = computed(() =>
    this.isHandset() ? ('over' as const) : ('side' as const),
  );

  readonly sidenavCollapsed = signal(false);

  readonly initials = computed(() => {
    const user = this.authStore.user();
    if (!user) return '?';
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  });

  readonly roleName = computed(() => {
    const roles = this.authStore.roles();
    if (roles.includes('SUPER_ADMIN'))  return 'Super Administrador';
    if (roles.includes('CLINIC_ADMIN')) return 'Admin Clínica';
    if (roles.includes('DOCTOR'))       return 'Médico';
    if (roles.includes('ASSISTANT'))    return 'Asistente';
    if (roles.includes('RECEPTIONIST')) return 'Recepcionista';
    if (roles.includes('PATIENT'))      return 'Paciente';
    return '';
  });

  readonly navGroups = computed((): NavGroup[] => {
    if (this.authStore.isSuperAdmin()) {
      return [
        {
          label: 'General',
          items: [
            { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
          ],
        },
        {
          label: 'Gestión Global',
          items: [
            { icon: 'corporate_fare', label: 'Organizaciones', route: '/admin/organizations' },
            { icon: 'card_membership', label: 'Suscripciones', route: '/admin/subscriptions' },
          ],
        },
        {
          label: 'Administración',
          items: [
            { icon: 'manage_accounts', label: 'Usuarios', route: '/admin/users' },
            { icon: 'business', label: 'Sucursales', route: '/admin/branches' },
            { icon: 'category', label: 'Catálogos', route: '/admin/catalogs' },
          ],
        },
      ];
    }

    return [
      {
        label: 'Operaciones',
        items: [
          { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
          { icon: 'calendar_month', label: 'Citas', route: '/admin/appointments' },
          { icon: 'people', label: 'Pacientes', route: '/admin/patients' },
        ],
      },
      {
        label: 'Clínica',
        items: [
          { icon: 'folder_open', label: 'Historial Clínico', route: '/admin/medical-records' },
          { icon: 'medical_services', label: 'Médicos', route: '/admin/doctors' },
        ],
      },
      {
        label: 'Configuración',
        items: [
          { icon: 'business', label: 'Sucursales', route: '/admin/branches' },
          { icon: 'category', label: 'Catálogos', route: '/admin/catalogs' },
          { icon: 'manage_accounts', label: 'Usuarios', route: '/admin/users' },
        ],
      },
    ];
  });

  onMenuClick(): void {
    if (this.isHandset()) {
      this.sidenav.toggle();
    } else {
      this.sidenavCollapsed.update((v) => !v);
    }
  }

  onNavItemClick(): void {
    if (this.isHandset()) {
      this.sidenav.close();
    }
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      disableClose: false,
    });
  }

  logout(): void {
    void this.authStore.logout();
  }
}
