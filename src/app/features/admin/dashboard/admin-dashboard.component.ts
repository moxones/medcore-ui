import { Component, OnInit, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TenantStore } from '@core/tenant/tenant.store';
import { DashboardStore } from '@core/dashboard/dashboard.store';
import { AuthStore } from '@core/auth/auth.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { DashboardHeroComponent } from '@shared/components/dashboard/dashboard-hero/dashboard-hero.component';
import { DashboardPanelComponent } from '@shared/components/dashboard/dashboard-panel/dashboard-panel.component';
import { QuickActionsComponent, QuickAction } from '@shared/components/dashboard/quick-actions/quick-actions.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    KpiCardComponent,
    DashboardHeroComponent,
    DashboardPanelComponent,
    QuickActionsComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly dashboardStore = inject(DashboardStore);
  readonly authStore = inject(AuthStore);

  readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  readonly greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  readonly formattedRevenue = computed(() => {
    const revenue = this.dashboardStore.summary()?.totalRevenueThisMonth ?? null;
    if (revenue === null) return '—';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(revenue);
  });

  readonly noShowRate = computed(() => {
    const rate = this.dashboardStore.summary()?.noShowRatePercentage ?? null;
    if (rate === null) return '—';
    return `${rate.toFixed(1)}%`;
  });

  readonly waitingCount = computed(() => {
    const s = this.dashboardStore.summary();
    if (!s) return 0;
    return Math.max(0, s.totalAppointmentsToday - s.completedAppointmentsToday - s.cancelledAppointmentsToday);
  });

  readonly completedPct = computed(() => {
    const s = this.dashboardStore.summary();
    if (!s || s.totalAppointmentsToday === 0) return 0;
    return Math.round((s.completedAppointmentsToday / s.totalAppointmentsToday) * 100);
  });

  readonly cancelledPct = computed(() => {
    const s = this.dashboardStore.summary();
    if (!s || s.totalAppointmentsToday === 0) return 0;
    return Math.round((s.cancelledAppointmentsToday / s.totalAppointmentsToday) * 100);
  });

  readonly waitingPct = computed(() => {
    const s = this.dashboardStore.summary();
    if (!s || s.totalAppointmentsToday === 0) return 0;
    return Math.round((this.waitingCount() / s.totalAppointmentsToday) * 100);
  });

  readonly donutBackground = computed(() => {
    const s = this.dashboardStore.summary();
    if (!s || s.totalAppointmentsToday === 0) {
      return 'conic-gradient(var(--color-border) 0% 100%)';
    }
    const cp = this.completedPct();
    const ca = cp + this.waitingPct();
    return `conic-gradient(var(--color-success) 0% ${cp}%, var(--mat-sys-primary) ${cp}% ${ca}%, var(--color-border) ${ca}% 100%)`;
  });

  readonly quickLinks: QuickAction[] = [
    { icon: 'calendar_month', label: 'Citas', description: 'Gestionar la agenda de la clínica', route: '/admin/appointments', accent: 'blue' },
    { icon: 'groups', label: 'Médicos', description: 'Administrar el equipo médico', route: '/admin/doctors', accent: 'purple' },
    { icon: 'personal_injury', label: 'Pacientes', description: 'Buscar y registrar pacientes', route: '/admin/patients', accent: 'green' },
    { icon: 'manage_accounts', label: 'Usuarios', description: 'Cuentas y roles del personal', route: '/admin/users', accent: 'orange' },
    { icon: 'business', label: 'Sucursales', description: 'Sedes y configuración', route: '/admin/branches', accent: 'blue' },
    { icon: 'category', label: 'Catálogos', description: 'Especialidades y tipos', route: '/admin/catalogs', accent: 'red' },
  ];

  ngOnInit(): void {
    void this.dashboardStore.loadSummary();
    void this.dashboardStore.loadProductivity();
  }
}
