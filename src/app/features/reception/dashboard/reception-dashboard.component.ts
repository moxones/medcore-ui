import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { ReceptionDashboardStore } from '@core/stores/reception-dashboard.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { AppointmentFlowStatus } from '@core/models/appointment.model';

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule, KpiCardComponent],
  templateUrl: './reception-dashboard.component.html',
  styleUrl: './reception-dashboard.component.scss',
})
export class ReceptionDashboardComponent implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);
  readonly dashboardStore = inject(ReceptionDashboardStore);

  readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  ngOnInit(): void {
    void this.dashboardStore.loadToday();
  }

  statusClass(status: AppointmentFlowStatus): string {
    return status.toLowerCase().replace('_', '-');
  }

  statusLabel(status: AppointmentFlowStatus): string {
    const labels: Record<AppointmentFlowStatus, string> = {
      WAITING: 'En espera',
      IN_CONSULTATION: 'En consulta',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return labels[status];
  }

  formatTime(scheduledAt: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(scheduledAt));
  }
}
