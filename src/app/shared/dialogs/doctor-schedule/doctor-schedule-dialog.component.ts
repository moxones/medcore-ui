import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DoctorService } from '@core/services/doctor.service';
import { DoctorStore } from '@core/stores/doctor.store';
import { DoctorBranchResponse, DoctorScheduleResponse } from '@core/models/doctor.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface DoctorScheduleDialogData {
  doctorId: number;
  doctorName: string;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se puede conectar al servidor.';
    const msg = (err.error as { message?: string } | null)?.message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

@Component({
  selector: 'app-doctor-schedule-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-schedule-dialog.component.html',
  styleUrl: './doctor-schedule-dialog.component.scss',
})
export class DoctorScheduleDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DoctorScheduleDialogComponent>);
  readonly data = inject<DoctorScheduleDialogData>(MAT_DIALOG_DATA);
  private readonly doctorService = inject(DoctorService);
  private readonly doctorStore = inject(DoctorStore);

  readonly DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly DAYS = [0, 1, 2, 3, 4, 5, 6];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly branches = signal<DoctorBranchResponse[]>([]);
  readonly schedules = signal<DoctorScheduleResponse[]>([]);
  readonly selectedBranchId = signal<number | null>(null);

  readonly addingForDay = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly slotForm = new FormGroup({
    startTime: new FormControl('08:00', { nonNullable: true, validators: [Validators.required] }),
    endTime: new FormControl('12:00', { nonNullable: true, validators: [Validators.required] }),
    slotDurationMinutes: new FormControl(30, { nonNullable: true, validators: [Validators.required, Validators.min(5), Validators.max(240)] }),
    maxPatientsPerSlot: new FormControl<number | null>(null),
  });

  readonly selectedBranch = computed(() =>
    this.branches().find(b => b.branchId === this.selectedBranchId()),
  );

  readonly visibleSchedules = computed(() => {
    const branchId = this.selectedBranchId();
    if (branchId === null) return this.schedules();
    return this.schedules().filter(s => s.branchId === branchId);
  });

  async ngOnInit(): Promise<void> {
    try {
      const [branchesRes, schedulesRes] = await Promise.all([
        firstValueFrom(this.doctorService.getBranches(this.data.doctorId)),
        firstValueFrom(this.doctorService.getSchedules(this.data.doctorId, { isActive: true })),
      ]);
      const active = branchesRes.data.filter(b => b.isActive);
      this.branches.set(active);
      this.schedules.set(schedulesRes.data);
      if (active.length > 0) this.selectedBranchId.set(active[0].branchId);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  schedulesForDay(day: number): DoctorScheduleResponse[] {
    return this.visibleSchedules().filter(s => s.dayOfWeek === day);
  }

  isFormOpenForDay(day: number): boolean {
    return this.addingForDay() === day || this.schedulesForDay(day).some(s => s.id === this.editingId());
  }

  onBranchChange(event: Event): void {
    const id = parseInt((event.target as HTMLSelectElement).value, 10);
    this.selectedBranchId.set(id);
    this.cancelForm();
  }

  startAdd(day: number): void {
    this.editingId.set(null);
    this.addingForDay.set(day);
    this.slotForm.reset({ startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30, maxPatientsPerSlot: null });
  }

  startEdit(schedule: DoctorScheduleResponse): void {
    this.addingForDay.set(null);
    this.editingId.set(schedule.id);
    this.slotForm.setValue({
      startTime: schedule.startTime.slice(0, 5),
      endTime: schedule.endTime.slice(0, 5),
      slotDurationMinutes: schedule.slotDurationMinutes,
      maxPatientsPerSlot: schedule.maxPatientsPerSlot,
    });
  }

  cancelForm(): void {
    this.addingForDay.set(null);
    this.editingId.set(null);
  }

  async saveSlot(): Promise<void> {
    if (this.slotForm.invalid || this.saving()) return;
    const branch = this.selectedBranch();
    if (!branch) return;

    const val = this.slotForm.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    try {
      const editId = this.editingId();
      if (editId !== null) {
        const res = await firstValueFrom(
          this.doctorService.updateSchedule(this.data.doctorId, editId, {
            startTime: val.startTime,
            endTime: val.endTime,
            slotDurationMinutes: val.slotDurationMinutes,
            maxPatientsPerSlot: val.maxPatientsPerSlot ?? undefined,
          }),
        );
        this.schedules.update(list => list.map(s => (s.id === editId ? res.data : s)));
      } else {
        const day = this.addingForDay();
        if (day === null) return;
        const res = await firstValueFrom(
          this.doctorService.createSchedule(this.data.doctorId, {
            doctorBranchId: branch.id,
            dayOfWeek: day,
            startTime: val.startTime,
            endTime: val.endTime,
            slotDurationMinutes: val.slotDurationMinutes,
            maxPatientsPerSlot: val.maxPatientsPerSlot ?? undefined,
          }),
        );
        this.schedules.update(list => [...list, res.data]);
      }
      void this.doctorStore.load();
      this.cancelForm();
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  async deleteSlot(schedule: DoctorScheduleResponse): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.doctorService.deactivateSchedule(this.data.doctorId, schedule.id));
      this.schedules.update(list => list.filter(s => s.id !== schedule.id));
      void this.doctorStore.load();
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  formatSlot(schedule: DoctorScheduleResponse): string {
    return `${schedule.startTime.slice(0, 5)} – ${schedule.endTime.slice(0, 5)}`;
  }

  clearError(): void {
    this.error.set(null);
  }

  close(): void {
    this.dialogRef.close();
  }
}
