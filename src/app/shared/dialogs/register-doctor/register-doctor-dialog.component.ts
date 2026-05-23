import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '@core/services/user.service';
import { DoctorService } from '@core/services/doctor.service';
import { BranchService } from '@core/services/branch.service';
import { CatalogService } from '@core/services/catalog.service';
import { DoctorStore } from '@core/stores/doctor.store';
import { UserResponse } from '@core/models/user.model';
import { BranchResponse } from '@core/models/branch.model';
import { CatalogItemResponse } from '@core/models/catalog.model';
import { DoctorBranchResponse } from '@core/models/doctor.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

type WizardStep = 1 | 2 | 3;
type SchedulePreset = 'mananas' | 'jornada' | 'custom';

interface BranchScheduleConfig {
  preset: SchedulePreset;
  days: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
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
  selector: 'app-register-doctor-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AlertBannerComponent,
  ],
  templateUrl: './register-doctor-dialog.component.html',
  styleUrl: './register-doctor-dialog.component.scss',
})
export class RegisterDoctorDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<RegisterDoctorDialogComponent>);
  private readonly userService = inject(UserService);
  private readonly doctorService = inject(DoctorService);
  private readonly branchService = inject(BranchService);
  private readonly catalogService = inject(CatalogService);
  private readonly doctorStore = inject(DoctorStore);

  readonly step = signal<WizardStep>(1);
  readonly loadingData = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly doctorUsers = signal<UserResponse[]>([]);
  readonly specialties = signal<CatalogItemResponse[]>([]);
  readonly branches = signal<BranchResponse[]>([]);
  readonly doctorBranches = signal<DoctorBranchResponse[]>([]);

  readonly searchQuery = signal('');
  readonly selectedUserId = signal<number | null>(null);
  readonly licenseControl = new FormControl('', { nonNullable: true });
  readonly selectedSpecialtyIds = signal<number[]>([]);
  readonly selectedBranchIds = signal<number[]>([]);

  readonly createdDoctorId = signal<number | null>(null);
  readonly step1Done = signal(false);
  readonly step2Done = signal(false);

  readonly activeDoctorBranchId = signal<number | null>(null);
  readonly scheduleConfigs = signal<Record<number, BranchScheduleConfig>>({});

  readonly GRID_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  readonly DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  readonly SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.doctorUsers();
    return this.doctorUsers().filter(u => {
      const name = `${u.person.firstName} ${u.person.lastName}`.toLowerCase();
      return name.includes(q) || u.email.toLowerCase().includes(q);
    });
  });

  readonly selectedUser = computed(() =>
    this.doctorUsers().find(u => u.id === this.selectedUserId()),
  );

  readonly canContinue1 = computed(() => this.selectedUserId() !== null);

  readonly activeConfig = computed((): BranchScheduleConfig | null => {
    const id = this.activeDoctorBranchId();
    if (id === null) return null;
    return this.scheduleConfigs()[id] ?? null;
  });

  readonly activeBranchName = computed(() => {
    const id = this.activeDoctorBranchId();
    return this.doctorBranches().find(b => b.id === id)?.branchName ?? '';
  });

  readonly weeklyHours = computed(() => {
    const cfg = this.activeConfig();
    if (!cfg) return 0;
    const startH = parseInt(cfg.startTime.split(':')[0], 10);
    const endH = parseInt(cfg.endTime.split(':')[0], 10);
    return cfg.days.length * Math.max(0, endH - startH);
  });

  readonly weeklySlots = computed(() => {
    const cfg = this.activeConfig();
    if (!cfg || cfg.slotDurationMinutes <= 0) return 0;
    const startH = parseInt(cfg.startTime.split(':')[0], 10);
    const endH = parseInt(cfg.endTime.split(':')[0], 10);
    const totalMinutes = cfg.days.length * Math.max(0, endH - startH) * 60;
    return Math.floor(totalMinutes / cfg.slotDurationMinutes);
  });

  readonly gridRows = computed(() => {
    const cfg = this.activeConfig();
    return this.GRID_HOURS.map(hour => ({
      hour,
      label: hour % 2 === 0 ? hour.toString().padStart(2, '0') : '',
      cells: this.DAY_LABELS.map((_, dayIdx) => {
        if (!cfg) return false;
        const startH = parseInt(cfg.startTime.split(':')[0], 10);
        const endH = parseInt(cfg.endTime.split(':')[0], 10);
        return cfg.days.includes(dayIdx) && hour >= startH && hour < endH;
      }),
    }));
  });

  async ngOnInit(): Promise<void> {
    await this.loadStep1Data();
  }

  private async loadStep1Data(): Promise<void> {
    this.loadingData.set(true);
    try {
      const [usersRes, specialtiesRes, doctorsRes] = await Promise.all([
        firstValueFrom(this.userService.getList()),
        firstValueFrom(this.catalogService.getClinicSpecialties()),
        firstValueFrom(this.doctorService.getCardList({ page: 0, size: 200 })),
      ]);
      const registeredPersonIds = new Set<number>(
        doctorsRes.data.content
          .map(d => d.personId)
          .filter((id): id is number => typeof id === 'number'),
      );
      const allDoctorUsers = usersRes.data.filter(
        u => u.roles.some(r => r.code === 'DOCTOR') && u.isActive && !registeredPersonIds.has(u.person.id),
      );
      this.specialties.set(specialtiesRes.data.filter(s => s.activated));
      this.doctorUsers.set(allDoctorUsers);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.loadingData.set(false);
    }
  }

  private async loadBranches(): Promise<void> {
    this.loadingData.set(true);
    try {
      const res = await firstValueFrom(this.branchService.getList({ size: 100 }));
      this.branches.set(res.data.content);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.loadingData.set(false);
    }
  }

  selectUser(userId: number): void {
    if (this.step1Done()) return;
    this.selectedUserId.set(this.selectedUserId() === userId ? null : userId);
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUserId() === userId;
  }

  toggleSpecialty(id: number): void {
    if (this.step1Done()) return;
    const current = this.selectedSpecialtyIds();
    this.selectedSpecialtyIds.set(
      current.includes(id) ? current.filter(x => x !== id) : [...current, id],
    );
  }

  isSpecialtySelected(id: number): boolean {
    return this.selectedSpecialtyIds().includes(id);
  }

  toggleBranch(branchId: number): void {
    if (this.step2Done()) return;
    const current = this.selectedBranchIds();
    this.selectedBranchIds.set(
      current.includes(branchId) ? current.filter(x => x !== branchId) : [...current, branchId],
    );
  }

  isBranchSelected(branchId: number): boolean {
    return this.selectedBranchIds().includes(branchId);
  }

  getUserInitials(user: UserResponse): string {
    return `${user.person.firstName[0] ?? ''}${user.person.lastName[0] ?? ''}`.toUpperCase();
  }

  getDocumentNumber(user: UserResponse): string {
    return user.person.documents[0]?.documentNumber ?? '';
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  async continueStep1(): Promise<void> {
    if (this.step1Done()) {
      this.step.set(2);
      return;
    }
    const user = this.selectedUser();
    if (!user) return;

    this.saving.set(true);
    this.error.set(null);
    try {
      const doctorRes = await firstValueFrom(
        this.doctorService.create({
          person: { id: user.person.id },
          licenseNumber: this.licenseControl.value.trim(),
        }),
      );
      const doctorId = doctorRes.data.id;
      this.createdDoctorId.set(doctorId);

      if (this.selectedSpecialtyIds().length > 0) {
        await firstValueFrom(
          this.doctorService.bulkAssignSpecialties(doctorId, this.selectedSpecialtyIds()),
        );
      }

      this.step1Done.set(true);
      await this.loadBranches();
      this.step.set(2);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  async continueStep2(): Promise<void> {
    if (this.step2Done()) {
      this.step.set(3);
      return;
    }
    const doctorId = this.createdDoctorId();
    if (!doctorId || this.selectedBranchIds().length === 0) return;

    this.saving.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.doctorService.bulkAssignBranches(doctorId, { branchIds: this.selectedBranchIds() }),
      );
      const assignedBranches = res.data;
      this.doctorBranches.set(assignedBranches);
      this.step2Done.set(true);

      const initialConfigs: Record<number, BranchScheduleConfig> = {};
      for (const branch of assignedBranches) {
        initialConfigs[branch.id] = {
          preset: 'mananas',
          days: [0, 1, 2, 3, 4],
          startTime: '08:00',
          endTime: '12:00',
          slotDurationMinutes: 20,
        };
      }
      this.scheduleConfigs.set(initialConfigs);
      this.activeDoctorBranchId.set(assignedBranches[0]?.id ?? null);
      this.step.set(3);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  skipStep2(): void {
    void this.doctorStore.load();
    this.dialogRef.close(true);
  }

  async createDoctor(): Promise<void> {
    const doctorId = this.createdDoctorId();
    const branches = this.doctorBranches();
    if (!doctorId || branches.length === 0) {
      void this.doctorStore.load();
      this.dialogRef.close(true);
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const configs = this.scheduleConfigs();
      const requests: Promise<unknown>[] = [];
      for (const branch of branches) {
        const cfg = configs[branch.id];
        if (!cfg) continue;
        for (const day of cfg.days) {
          requests.push(
            firstValueFrom(
              this.doctorService.createSchedule(doctorId, {
                doctorBranchId: branch.id,
                dayOfWeek: day,
                startTime: cfg.startTime,
                endTime: cfg.endTime,
                slotDurationMinutes: cfg.slotDurationMinutes,
              }),
            ),
          );
        }
      }
      await Promise.all(requests);
      void this.doctorStore.load();
      this.dialogRef.close(true);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  skipStep3(): void {
    void this.doctorStore.load();
    this.dialogRef.close(true);
  }

  goBack(): void {
    const current = this.step();
    if (current > 1) this.step.set((current - 1) as WizardStep);
  }

  cancel(): void {
    if (this.step1Done()) {
      void this.doctorStore.load();
    }
    this.dialogRef.close(this.step1Done());
  }

  selectPreset(branchId: number, preset: SchedulePreset): void {
    const configs = { ...this.scheduleConfigs() };
    if (preset === 'mananas') {
      configs[branchId] = { preset, days: [0, 1, 2, 3, 4], startTime: '08:00', endTime: '12:00', slotDurationMinutes: 20 };
    } else if (preset === 'jornada') {
      configs[branchId] = { preset, days: [0, 1, 2, 3, 4], startTime: '09:00', endTime: '18:00', slotDurationMinutes: 30 };
    } else {
      configs[branchId] = { preset, days: [0, 1, 2, 3, 4], startTime: '08:00', endTime: '17:00', slotDurationMinutes: 30 };
    }
    this.scheduleConfigs.set(configs);
  }

  toggleDay(branchId: number, dayIdx: number): void {
    const configs = { ...this.scheduleConfigs() };
    const cfg = configs[branchId];
    if (!cfg) return;
    const days = cfg.days.includes(dayIdx)
      ? cfg.days.filter(d => d !== dayIdx)
      : [...cfg.days, dayIdx].sort((a, b) => a - b);
    configs[branchId] = { ...cfg, days };
    this.scheduleConfigs.set(configs);
  }

  isDaySelected(branchId: number, dayIdx: number): boolean {
    return this.scheduleConfigs()[branchId]?.days.includes(dayIdx) ?? false;
  }

  updateTime(branchId: number, field: 'startTime' | 'endTime', value: string): void {
    const configs = { ...this.scheduleConfigs() };
    const cfg = configs[branchId];
    if (!cfg) return;
    configs[branchId] = { ...cfg, [field]: value };
    this.scheduleConfigs.set(configs);
  }

  updateSlotDuration(branchId: number, value: string): void {
    const configs = { ...this.scheduleConfigs() };
    const cfg = configs[branchId];
    if (!cfg) return;
    configs[branchId] = { ...cfg, slotDurationMinutes: parseInt(value, 10) };
    this.scheduleConfigs.set(configs);
  }

  setActiveBranch(branchId: number): void {
    this.activeDoctorBranchId.set(branchId);
  }

  clearError(): void {
    this.error.set(null);
  }
}
