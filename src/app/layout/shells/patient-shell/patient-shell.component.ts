import { Component, ViewChild, computed, inject, signal } from '@angular/core';
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
  selector: 'app-patient-shell',
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
  templateUrl: './patient-shell.component.html',
  styleUrl: './patient-shell.component.scss',
})
export class PatientShellComponent {
  @ViewChild('sidenav') private readonly sidenav!: MatSidenav;

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

  readonly navGroups: NavGroup[] = [
    {
      label: 'Mi Portal',
      items: [
        { icon: 'dashboard', label: 'Dashboard', route: '/patient/dashboard' },
        { icon: 'calendar_month', label: 'Mis Citas', route: '/patient/appointments' },
        { icon: 'person', label: 'Mi Perfil', route: '/patient/profile' },
      ],
    },
  ];

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
