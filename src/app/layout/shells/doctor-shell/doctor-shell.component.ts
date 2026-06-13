import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { ProcessConfigStore } from '@core/stores/process-config.store';
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
  selector: 'app-doctor-shell',
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
    MatDividerModule,
    MatDialogModule,
    LogoutOverlayComponent,
  ],
  templateUrl: './doctor-shell.component.html',
  styleUrl: './doctor-shell.component.scss',
})
export class DoctorShellComponent implements OnInit {
  @ViewChild('sidenav') private readonly sidenav!: MatSidenav;

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);

  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);
  readonly processConfig = inject(ProcessConfigStore);

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
    const first = user.firstName?.[0] ?? '';
    const last = user.lastName?.[0] ?? '';
    return `${first}${last}`.toUpperCase() || '?';
  });

  readonly navGroups: NavGroup[] = [
    {
      label: 'Mi Día',
      items: [
        { icon: 'dashboard', label: 'Inicio', route: '/doctor/dashboard' },
        { icon: 'event_available', label: 'Pacientes de Hoy', route: '/doctor/today' },
        { icon: 'event_note', label: 'Agenda', route: '/doctor/schedule' },
      ],
    },
    {
      label: 'Atención',
      items: [
        { icon: 'stethoscope', label: 'Sala de Consulta', route: '/doctor/consultation' },
        { icon: 'folder_open', label: 'Historiales Clínicos', route: '/doctor/medical-records' },
      ],
    },
    {
      label: 'Mis Pacientes',
      items: [
        { icon: 'people', label: 'Pacientes', route: '/doctor/patients' },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { icon: 'schedule', label: 'Mi Disponibilidad', route: '/doctor/availability' },
        { icon: 'prescriptions', label: 'Recetas', route: '/doctor/prescriptions' },
        { icon: 'science', label: 'Órdenes y Exámenes', route: '/doctor/orders' },
        { icon: 'description', label: 'Plantillas', route: '/doctor/templates' },
      ],
    },
    {
      label: 'Análisis',
      items: [
        { icon: 'monitoring', label: 'Reportes', route: '/doctor/reports' },
      ],
    },
    {
      label: 'Cuenta',
      items: [
        { icon: 'badge', label: 'Mi Perfil', route: '/doctor/profile' },
      ],
    },
  ];

  ngOnInit(): void {
    this.tenantStore.load();
    void this.processConfig.load();
  }

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
