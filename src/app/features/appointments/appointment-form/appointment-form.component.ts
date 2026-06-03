import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { DoctorService } from '@core/services/doctor.service';
import { PatientService } from '@core/services/patient.service';
import { CatalogService } from '@core/services/catalog.service';
import { PatientProfileStore } from '@core/stores/patient-profile.store';
import { AppointmentResponse, BookingSource, TimeSlotResponse } from '@core/models/appointment.model';
import { DoctorCardResponse, DoctorBranchResponse } from '@core/models/doctor.model';
import { CatalogItemResponse } from '@core/models/catalog.model';
import { PatientResponse } from '@core/models/patient.model';

interface WeekDay {
  date: Date;
  iso: string;
  abbr: string;
  num: number;
  isToday: boolean;
  isPast: boolean;
}

interface BookingSourceOption {
  value: BookingSource;
  label: string;
}

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentFormComponent implements OnInit {
  readonly mode = input<'patient' | 'reception'>('patient');
  readonly initialPatient = input<PatientResponse | null>(null);
  readonly appointmentCreated = output<AppointmentResponse>();
  readonly requestNewPatient = output<void>();
  readonly cancelRequested = output<void>();

  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly catalogService = inject(CatalogService);
  private readonly profileStore = inject(PatientProfileStore);

  readonly patientQuery = signal('');
  readonly patientResults = signal<PatientResponse[]>([]);
  readonly patientSearchLoading = signal(false);
  readonly selectedPatient = signal<PatientResponse | null>(null);
  private patientSearchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly specialties = signal<CatalogItemResponse[]>([]);
  readonly specialtyFilter = signal<number | null>(null);

  readonly doctorQuery = signal('');
  readonly doctors = signal<DoctorCardResponse[]>([]);
  readonly doctorsLoading = signal(false);
  readonly selectedDoctor = signal<DoctorCardResponse | null>(null);

  readonly branches = signal<DoctorBranchResponse[]>([]);
  readonly branchesLoading = signal(false);
  readonly selectedBranch = signal<DoctorBranchResponse | null>(null);

  readonly weekStart = signal<Date>(this.getMonday(new Date()));
  readonly selectedDate = signal<string | null>(null);

  readonly slots = signal<TimeSlotResponse[]>([]);
  readonly slotsLoading = signal(false);
  readonly selectedSlot = signal<TimeSlotResponse | null>(null);

  readonly appointmentTypes = signal<CatalogItemResponse[]>([]);
  readonly selectedTypeId = signal<number | null>(null);
  readonly reason = signal('');
  readonly bookingSource = signal<BookingSource>('IN_PERSON');

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly createdAppointment = signal<AppointmentResponse | null>(null);

  readonly bookingSources: BookingSourceOption[] = [
    { value: 'IN_PERSON', label: 'En persona' },
    { value: 'PHONE', label: 'Teléfono' },
    { value: 'SELF', label: 'Self' },
  ];

  readonly filteredDoctors = computed(() => {
    const q = this.doctorQuery().toLowerCase().trim();
    if (!q) return this.doctors();
    return this.doctors().filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.specialties.some((s) => s.toLowerCase().includes(q)),
    );
  });

  readonly weekDays = computed((): WeekDay[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.weekStart());
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return {
        date: d,
        iso: this.toIso(d),
        abbr: this.getDayAbbr(d),
        num: d.getDate(),
        isToday: d.getTime() === today.getTime(),
        isPast: d.getTime() < today.getTime(),
      };
    });
  });

  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(this.weekStart()),
  );

  readonly contextLabel = computed(() => {
    const parts: string[] = [];
    const date = this.selectedDate();
    const branch = this.selectedBranch();
    const doctor = this.selectedDoctor();
    if (date) parts.push(this.formatShortDate(date));
    if (branch) parts.push(branch.branchName);
    if (doctor) parts.push(doctor.fullName);
    return parts.join(' · ');
  });

  readonly isCurrentWeek = computed(() => {
    const monday = this.getMonday(new Date());
    return this.weekStart().getTime() === monday.getTime();
  });

  readonly canSubmit = computed(
    () =>
      (this.mode() === 'patient' || this.selectedPatient() !== null) &&
      this.selectedDoctor() !== null &&
      this.selectedBranch() !== null &&
      this.selectedDate() !== null &&
      this.selectedSlot() !== null,
  );

  readonly patientInitials = computed(() => {
    const p = this.selectedPatient();
    if (!p) return '';
    return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
  });

  constructor() {
    effect(() => {
      const doctor = this.selectedDoctor();
      if (doctor) {
        void this.loadBranches(doctor.id);
      } else {
        this.branches.set([]);
        this.selectedBranch.set(null);
        this.selectedDate.set(null);
        this.selectedSlot.set(null);
      }
    });

    effect(() => {
      const doctor = this.selectedDoctor();
      const branch = this.selectedBranch();
      const date = this.selectedDate();
      if (doctor && branch && date) {
        void this.loadSlots(doctor.id, branch.branchId, date);
      } else {
        this.slots.set([]);
        this.selectedSlot.set(null);
      }
    });
  }

  ngOnInit(): void {
    const initial = this.initialPatient();
    if (initial) this.selectedPatient.set(initial);
    void this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    this.doctorsLoading.set(true);
    if (this.mode() === 'patient' && !this.profileStore.profile()) {
      await this.profileStore.loadProfile();
    }
    const [doctorsRes, specialtiesRes, typesRes] = await Promise.all([
      firstValueFrom(this.doctorService.getCardList({ isActive: true, size: 50 })),
      firstValueFrom(this.catalogService.getClinicSpecialties()),
      firstValueFrom(this.catalogService.getClinicAppointmentTypes()),
    ]);
    this.doctors.set(doctorsRes.data.content);
    this.specialties.set(specialtiesRes.data.filter((s) => s.activated));
    this.appointmentTypes.set(typesRes.data.filter((t) => t.activated));
    this.doctorsLoading.set(false);
  }

  async setSpecialtyFilter(specialtyId: number | null): Promise<void> {
    if (this.specialtyFilter() === specialtyId) return;
    this.specialtyFilter.set(specialtyId);
    this.selectedDoctor.set(null);
    this.doctorsLoading.set(true);
    const res = await firstValueFrom(
      this.doctorService.getCardList({
        isActive: true,
        size: 50,
        ...(specialtyId ? { specialtyId } : {}),
      }),
    );
    this.doctors.set(res.data.content);
    this.doctorsLoading.set(false);
  }

  selectDoctor(doctor: DoctorCardResponse): void {
    if (this.selectedDoctor()?.id === doctor.id) return;
    this.selectedDoctor.set(doctor);
    this.doctorQuery.set('');
  }

  clearDoctor(): void {
    this.selectedDoctor.set(null);
  }

  private async loadBranches(doctorId: number): Promise<void> {
    this.branchesLoading.set(true);
    try {
      const res = await firstValueFrom(this.doctorService.getBranches(doctorId));
      const active = res.data.filter((b) => b.isActive);
      this.branches.set(active);
      if (active.length === 1) this.selectedBranch.set(active[0]);
    } finally {
      this.branchesLoading.set(false);
    }
  }

  selectBranch(branch: DoctorBranchResponse): void {
    if (this.selectedBranch()?.id === branch.id) return;
    this.selectedBranch.set(branch);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
  }

  selectDate(iso: string): void {
    this.selectedDate.set(iso);
    this.selectedSlot.set(null);
  }

  prevWeek(): void {
    if (this.isCurrentWeek()) return;
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() - 7);
    this.weekStart.set(d);
  }

  nextWeek(): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + 7);
    this.weekStart.set(d);
  }

  private async loadSlots(doctorId: number, branchId: number, date: string): Promise<void> {
    this.slotsLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.appointmentService.getAvailableSlots({ doctorId, branchId, date }),
      );
      this.slots.set(res.data);
    } catch {
      this.slots.set([]);
    } finally {
      this.slotsLoading.set(false);
    }
  }

  selectSlot(slot: TimeSlotResponse): void {
    if (!slot.isAvailable) return;
    this.selectedSlot.set(
      this.selectedSlot()?.startTime === slot.startTime ? null : slot,
    );
  }

  onPatientQueryChange(query: string): void {
    this.patientQuery.set(query);
    if (this.patientSearchTimer) clearTimeout(this.patientSearchTimer);
    if (query.trim().length < 2) {
      this.patientResults.set([]);
      this.patientSearchLoading.set(false);
      return;
    }
    this.patientSearchLoading.set(true);
    this.patientSearchTimer = setTimeout(async () => {
      try {
        const res = await firstValueFrom(this.patientService.search(query.trim()));
        this.patientResults.set(res.data);
      } finally {
        this.patientSearchLoading.set(false);
      }
    }, 300);
  }

  selectPatient(patient: PatientResponse): void {
    this.selectedPatient.set(patient);
    this.patientQuery.set('');
    this.patientResults.set([]);
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.patientQuery.set('');
    this.patientResults.set([]);
  }

  async submit(): Promise<void> {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);

    const doctor = this.selectedDoctor()!;
    const branch = this.selectedBranch()!;
    const slot = this.selectedSlot()!;
    const date = this.selectedDate()!;

    let patientId: number;
    if (this.mode() === 'patient') {
      const profile = this.profileStore.profile();
      if (!profile) {
        this.submitError.set('No se pudo obtener el perfil. Recarga la página.');
        this.submitting.set(false);
        return;
      }
      patientId = profile.patientId;
    } else {
      patientId = this.selectedPatient()!.id;
    }

    try {
      const res = await firstValueFrom(
        this.appointmentService.create({
          patientId,
          doctorId: doctor.id,
          branchId: branch.branchId,
          scheduledAt: `${date}T${slot.startTime}:00`,
          appointmentTypeId: this.selectedTypeId() ?? undefined,
          reason: this.reason().trim() || undefined,
          bookingSource: this.mode() === 'patient' ? 'SELF' : this.bookingSource(),
        }),
      );
      this.createdAppointment.set(res.data);
      this.appointmentCreated.emit(res.data);
    } catch {
      this.submitError.set(
        'No se pudo confirmar la cita. El horario puede ya estar tomado. Elige otro.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm(): void {
    this.createdAppointment.set(null);
    this.selectedDoctor.set(null);
    this.selectedBranch.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.selectedTypeId.set(null);
    this.reason.set('');
    this.submitError.set(null);
    if (this.mode() === 'reception') {
      this.selectedPatient.set(null);
    }
  }

  formatScheduledAt(scheduledAt: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(scheduledAt));
  }

  private toIso(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return d;
  }

  private getDayAbbr(date: Date): string {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
  }

  private formatShortDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(year, month - 1, day));
  }
}
