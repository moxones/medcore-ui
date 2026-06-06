import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { DoctorScheduleStore, ScheduleView } from '@core/stores/doctor-schedule.store';
import { AppointmentFlowStatus, AppointmentResponse } from '@core/models/appointment.model';

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressBarModule, AlertBannerComponent],
  templateUrl: './doctor-schedule.component.html',
  styleUrl: './doctor-schedule.component.scss',
})
export class DoctorScheduleComponent implements OnInit {
  readonly store = inject(DoctorScheduleStore);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.loadInit();
  }

  setView(view: ScheduleView): void {
    this.store.setView(view);
  }

  appointmentsFor(iso: string): AppointmentResponse[] {
    return this.store.byDay().get(iso) ?? [];
  }

  onAppointmentClick(appt: AppointmentResponse): void {
    if (['WAITING', 'CALLED', 'IN_PROCESS'].includes(appt.flowStatus)) {
      void this.router.navigate(['/doctor/consultation'], {
        queryParams: { appointmentId: appt.id },
      });
    }
  }

  isActionable(appt: AppointmentResponse): boolean {
    return ['WAITING', 'CALLED', 'IN_PROCESS'].includes(appt.flowStatus);
  }

  formatTime(iso: string): string {
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  flowLabel(status: AppointmentFlowStatus): string {
    const labels: Record<AppointmentFlowStatus, string> = {
      SCHEDULED: 'Programada',
      WAITING: 'En espera',
      CALLED: 'Llamado',
      IN_PROCESS: 'En consulta',
      PENDING_PAYMENT: 'Por cobrar',
      COMPLETED: 'Atendida',
    };
    return labels[status];
  }

  flowClass(status: AppointmentFlowStatus): string {
    return status.toLowerCase().replace('_', '-');
  }
}
