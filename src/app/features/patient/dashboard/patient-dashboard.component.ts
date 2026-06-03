import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { PatientDashboardStore } from '@core/stores/patient-dashboard.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { CompleteProfileDialogComponent } from '@shared/dialogs/complete-profile/complete-profile-dialog.component';
import { AppointmentResponse } from '@core/models/appointment.model';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressBarModule, MatDialogModule, KpiCardComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss',
})
export class PatientDashboardComponent implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);
  readonly dashboardStore = inject(PatientDashboardStore);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    void this.dashboardStore.loadAll();
  }

  openCompleteProfile(): void {
    this.dialog.open(CompleteProfileDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
    });
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

  badgeLabel(appt: AppointmentResponse): string {
    if (appt.flowStatus === 'IN_PROCESS') return 'En consulta';
    if (appt.flowStatus === 'COMPLETED') return 'Completada';
    return 'Programada';
  }

  badgeClass(appt: AppointmentResponse): string {
    if (appt.flowStatus === 'IN_PROCESS') return 'in-process';
    if (appt.flowStatus === 'COMPLETED') return 'completed';
    return 'scheduled';
  }
}
