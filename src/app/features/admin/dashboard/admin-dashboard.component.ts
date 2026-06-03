import { Component, OnInit, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TenantStore } from '@core/tenant/tenant.store';
import { DashboardStore } from '@core/dashboard/dashboard.store';
import { AuthStore } from '@core/auth/auth.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';

interface QuickLink {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule, KpiCardComponent, RouterLink],
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

  readonly quickLinks: QuickLink[] = [
    { icon: 'calendar_month', label: 'Citas', route: '/admin/appointments' },
    { icon: 'groups', label: 'Médicos', route: '/admin/doctors' },
    { icon: 'personal_injury', label: 'Pacientes', route: '/admin/patients' },
    { icon: 'manage_accounts', label: 'Usuarios', route: '/admin/users' },
    { icon: 'business', label: 'Sucursales', route: '/admin/branches' },
    { icon: 'category', label: 'Catálogos', route: '/admin/catalogs' },
  ];

  ngOnInit(): void {
    void this.dashboardStore.loadSummary();
    void this.dashboardStore.loadProductivity();
  }
}
