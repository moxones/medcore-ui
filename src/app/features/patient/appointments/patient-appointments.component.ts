import { Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PatientAppointmentsStore } from '@core/stores/patient-appointments.store';
import { AppointmentFlowStatus, AppointmentResponse } from '@core/models/appointment.model';
import { ConfirmDialogComponent } from '@shared/dialogs/confirm/confirm-dialog.component';

interface FilterOption {
  label: string;
  value: AppointmentFlowStatus | '';
  statusId?: number;
}

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './patient-appointments.component.html',
  styleUrl: './patient-appointments.component.scss',
})
export class PatientAppointmentsComponent implements OnInit {
  readonly store = inject(PatientAppointmentsStore);
  private readonly dialog = inject(MatDialog);

  readonly cancelError = signal<string | null>(null);
  readonly Math = Math;

  readonly filters: FilterOption[] = [
    { label: 'Todas', value: '' },
    { label: 'En espera', value: 'WAITING', statusId: 1 },
    { label: 'En consulta', value: 'IN_PROCESS', statusId: 2 },
    { label: 'Completadas', value: 'COMPLETED', statusId: 3 },
  ];

  ngOnInit(): void {
    void this.store.load();
  }

  applyFilter(filter: FilterOption): void {
    this.store.setFilter(filter.value);
    void this.store.load({ statusId: filter.statusId });
  }

  onPage(direction: 'prev' | 'next'): void {
    const current = this.store.pageNumber();
    const next = direction === 'next' ? current + 1 : current - 1;
    void this.store.load({ page: next, statusId: this.activeStatusId() });
  }

  confirmCancel(appt: AppointmentResponse): void {
    this.cancelError.set(null);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Cancelar cita',
        message: `¿Seguro que deseas cancelar tu cita con ${appt.doctorName} el ${this.formatDate(appt.scheduledAt)}?`,
        confirmLabel: 'Sí, cancelar',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) void this.doCancel(appt.id);
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

  formatDateShort(scheduledAt: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(scheduledAt));
  }

  formatTime(scheduledAt: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(scheduledAt));
  }

  statusLabel(status: AppointmentFlowStatus): string {
    const map: Record<AppointmentFlowStatus, string> = {
      WAITING: 'En espera',
      IN_PROCESS: 'En consulta',
      COMPLETED: 'Completada',
    };
    return map[status];
  }

  statusClass(status: AppointmentFlowStatus): string {
    const map: Record<AppointmentFlowStatus, string> = {
      WAITING: 'waiting',
      IN_PROCESS: 'in-process',
      COMPLETED: 'completed',
    };
    return map[status];
  }

  private activeStatusId(): number | undefined {
    const f = this.filters.find((x) => x.value === this.store.activeFilter());
    return f?.statusId;
  }

  private async doCancel(id: number): Promise<void> {
    const err = await this.store.cancel(id);
    if (err) {
      this.cancelError.set(err);
    } else {
      void this.store.load({ statusId: this.activeStatusId() });
    }
  }
}
