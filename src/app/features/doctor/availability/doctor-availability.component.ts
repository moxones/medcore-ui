import {
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '@shared/dialogs/confirm/confirm-dialog.component';
import { DoctorAvailabilityStore } from '@core/stores/doctor-availability.store';
import { DoctorScheduleResponse } from '@core/models/doctor.model';

interface WeekDay {
  value: number;
  label: string;
  short: string;
}

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-availability.component.html',
  styleUrl: './doctor-availability.component.scss',
})
export class DoctorAvailabilityComponent implements OnInit {
  readonly store = inject(DoctorAvailabilityStore);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  readonly days: WeekDay[] = [
    { value: 0, label: 'Lunes', short: 'Lun' },
    { value: 1, label: 'Martes', short: 'Mar' },
    { value: 2, label: 'Miércoles', short: 'Mié' },
    { value: 3, label: 'Jueves', short: 'Jue' },
    { value: 4, label: 'Viernes', short: 'Vie' },
    { value: 5, label: 'Sábado', short: 'Sáb' },
    { value: 6, label: 'Domingo', short: 'Dom' },
  ];

  readonly addForm = this.fb.group({
    doctorBranchId: [null as number | null, Validators.required],
    dayOfWeek: [0, Validators.required],
    startTime: ['08:00', Validators.required],
    endTime: ['13:00', Validators.required],
    slotDurationMinutes: [20, [Validators.required, Validators.min(5), Validators.max(240)]],
    maxPatientsPerSlot: [null as number | null],
  });

  readonly daySummary = computed(() =>
    this.days.map((d) => ({
      ...d,
      blocks: this.store.schedulesByDay().get(d.value) ?? [],
    })),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.init();
  }

  private async init(): Promise<void> {
    await this.store.loadInit();
    const firstBranch = this.store.branches()[0];
    if (firstBranch) this.addForm.patchValue({ doctorBranchId: firstBranch.id });
  }

  async submit(): Promise<void> {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const v = this.addForm.getRawValue();
    const ok = await this.store.addSchedule({
      doctorBranchId: v.doctorBranchId as number,
      dayOfWeek: v.dayOfWeek as number,
      startTime: v.startTime as string,
      endTime: v.endTime as string,
      slotDurationMinutes: v.slotDurationMinutes as number,
      maxPatientsPerSlot: v.maxPatientsPerSlot ?? undefined,
    });
    if (ok) {
      this.addForm.patchValue({ startTime: '08:00', endTime: '13:00' });
    }
  }

  async remove(schedule: DoctorScheduleResponse): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Eliminar horario',
      message: `¿Eliminar el bloque ${this.formatTime(schedule.startTime)}–${this.formatTime(
        schedule.endTime,
      )} en ${schedule.branchName}?`,
      confirmLabel: 'Eliminar',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { width: '400px', data });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed) void this.store.removeSchedule(schedule.id);
  }

  formatTime(time: string): string {
    return time.slice(0, 5);
  }

  dayLabel(value: number): string {
    return this.days.find((d) => d.value === value)?.label ?? '';
  }
}
