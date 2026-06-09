import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { BranchContextStore } from '@core/stores/branch-context.store';
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
  selector: 'app-reception-shell',
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
    MatProgressBarModule,
    MatDialogModule,
    LogoutOverlayComponent,
  ],
  templateUrl: './reception-shell.component.html',
  styleUrl: './reception-shell.component.scss',
})
export class ReceptionShellComponent implements OnInit {
  @ViewChild('sidenav') private readonly sidenav!: MatSidenav;

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);

  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);
  readonly branchContext = inject(BranchContextStore);

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
      label: 'Principal',
      items: [
        { icon: 'dashboard', label: 'Dashboard', route: '/reception/dashboard' },
      ],
    },
    {
      label: 'Agenda',
      items: [
        { icon: 'calendar_month', label: 'Agenda del Día', route: '/reception/agenda' },
      ],
    },
    {
      label: 'Atención',
      items: [
        { icon: 'queue', label: 'Cola de Espera', route: '/reception/queue' },
        { icon: 'add_circle', label: 'Nueva Cita', route: '/reception/appointments/new' },
      ],
    },
    {
      label: 'Pacientes',
      items: [
        { icon: 'people', label: 'Pacientes', route: '/reception/patients' },
      ],
    },
    {
      label: 'Análisis',
      items: [
        { icon: 'monitoring', label: 'Reportes', route: '/reception/reports' },
      ],
    },
  ];

  ngOnInit(): void {
    this.tenantStore.load();
    void this.branchContext.init();
  }

  selectBranch(branchId: number): void {
    this.branchContext.setActiveBranch(branchId);
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
