import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { PatientDashboardStore } from '@core/stores/patient-dashboard.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { AppointmentFlowStatus } from '@core/models/appointment.model';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule, KpiCardComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss',
})
export class PatientDashboardComponent implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);
  readonly dashboardStore = inject(PatientDashboardStore);

  ngOnInit(): void {
    void this.dashboardStore.loadUpcoming();
  }

  formatDate(scheduledAt: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(scheduledAt));
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

  statusClass(status: AppointmentFlowStatus): string {
    return status.toLowerCase().replace('_', '-');
  }
}
