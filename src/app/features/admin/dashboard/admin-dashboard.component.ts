import { Component, OnInit, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TenantStore } from '@core/tenant/tenant.store';
import { DashboardStore } from '@core/dashboard/dashboard.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule, KpiCardComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly dashboardStore = inject(DashboardStore);

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

  ngOnInit(): void {
    void this.dashboardStore.loadSummary();
    void this.dashboardStore.loadProductivity();
  }
}
