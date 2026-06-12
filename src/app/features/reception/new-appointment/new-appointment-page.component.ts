import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { AppointmentBookingStore } from '@core/stores/appointment-booking.store';
import { PatientService } from '@core/services/patient.service';
import { PatientProfileResponse, PatientResponse } from '@core/models/patient.model';
import {
  AvailabilitySlot,
  BookingMode,
  DateRangeKey,
  DayNavKey,
  TimeOfDayKey,
} from '@core/models/availability.model';
import { BookingSource } from '@core/models/appointment.model';

interface ModeOption {
  value: BookingMode;
  label: string;
  icon: string;
}

interface RangeOption {
  value: DateRangeKey;
  label: string;
  hint: string;
}

interface DayNavOption {
  value: DayNavKey;
  label: string;
}

interface TimeFilterOption {
  value: TimeOfDayKey;
  label: string;
}

interface SourceOption {
  value: BookingSource;
  label: string;
}

@Component({
  selector: 'app-new-appointment-page',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule],
  providers: [AppointmentBookingStore],
  templateUrl: './new-appointment-page.component.html',
  styleUrl: './new-appointment-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewAppointmentPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly store = inject(AppointmentBookingStore);

  readonly selfBooking = input<boolean>(false);

  readonly selfLoading = signal(false);
  readonly selfError = signal(false);

  readonly modes: ModeOption[] = [
    { value: 'specialty', label: 'Por especialidad', icon: 'medical_services' },
    { value: 'doctor', label: 'Doctor específico', icon: 'person_search' },
  ];

  readonly ranges: RangeOption[] = [
    { value: 'today', label: 'Solo hoy', hint: 'turnos de hoy' },
    { value: 'next7', label: 'Próximos 7 días', hint: 'desde hoy' },
    { value: 'next14', label: 'Próximos 14 días', hint: 'dos semanas' },
    { value: 'next30', label: 'Próximos 30 días', hint: 'un mes' },
  ];

  readonly dayNavs: DayNavOption[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'tomorrow', label: 'Mañana' },
    { value: 'week', label: 'Todo' },
  ];

  readonly timeFilters: TimeFilterOption[] = [
    { value: 'all', label: 'Todo el día' },
    { value: 'morning', label: 'Solo mañanas' },
    { value: 'afternoon', label: 'Solo tardes' },
  ];

  readonly sources: SourceOption[] = [
    { value: 'IN_PERSON', label: 'En persona' },
    { value: 'PHONE', label: 'Teléfono' },
  ];

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.selfBooking()) {
      await this.loadSelfPatient();
      return;
    }
    const params = this.route.snapshot.queryParamMap;
    const patientId = params.get('patientId');
    const walkIn = params.get('walkIn') === 'true';
    let patient: PatientResponse | null = null;
    if (patientId) {
      try {
        const res = await firstValueFrom(this.patientService.getById(Number(patientId)));
        patient = res.data;
      } catch {
        patient = null;
      }
    }
    await this.store.init(patient, walkIn);
  }

  crumbText(): string {
    return this.selfBooking() ? 'Mis citas · Agendar cita' : 'Recepción · Agendar atención';
  }

  async loadSelfPatient(): Promise<void> {
    this.selfError.set(false);
    this.selfLoading.set(true);
    let patient: PatientResponse | null = null;
    try {
      const profile = await firstValueFrom(this.patientService.getProfile());
      if (!profile.patientId) {
        this.selfError.set(true);
      } else {
        patient = this.profileToPatient(profile);
      }
    } catch {
      this.selfError.set(true);
    } finally {
      this.selfLoading.set(false);
    }
    await this.store.init(patient, false, true);
  }

  private profileToPatient(profile: PatientProfileResponse): PatientResponse {
    return {
      id: profile.patientId!,
      firstName: profile.firstName,
      lastName: profile.lastName,
      contactEmail: profile.contactEmail,
      phone: profile.phone,
      birthDate: profile.birthDate,
      gender: profile.gender,
      profileCompleted: profile.profileCompleted,
      hasAccount: profile.hasAccount,
      userEmail: profile.contactEmail,
      accountActive: profile.accountActive,
    };
  }

  resultsTitle(): string {
    if (this.store.mode() === 'doctor') {
      return this.store.selectedDoctor()?.fullName ?? 'Doctor específico';
    }
    return this.store.selectedSpecialty()?.name ?? 'Especialidad';
  }

  activeDoctorLabel(): string {
    const id = this.store.doctorFilterId();
    if (id === null) return 'cualquier médico';
    return this.store.specialtyDoctors().find((d) => d.id === id)?.fullName ?? 'médico';
  }

  accentForName(name: string): string {
    const sum = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return `accent-${sum % 6}`;
  }

  reserveFirst(): void {
    const first = this.store.firstSlot();
    if (first) this.store.selectSlot(first.date, first.slot);
  }

  dayHeading(iso: string): string {
    const date = this.parseIso(iso);
    const today = this.startOfToday();
    const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    const prefix = diff === 0 ? 'Hoy · ' : diff === 1 ? 'Mañana · ' : '';
    return prefix + this.formatLongDay(date);
  }

  heroHeadline(iso: string, slot: AvailabilitySlot): string {
    const date = this.parseIso(iso);
    const today = this.startOfToday();
    const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    const prefix = diff === 0 ? 'Hoy, ' : diff === 1 ? 'Mañana, ' : '';
    return `${prefix}${this.formatLongDay(date)} · ${slot.startTime}`;
  }

  heroRelative(iso: string, slot: AvailabilitySlot): string {
    const [h, m] = slot.startTime.split(':').map(Number);
    const target = this.parseIso(iso);
    target.setHours(h, m, 0, 0);
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return 'ahora';
    const minutes = Math.round(diffMs / 60_000);
    if (minutes < 60) return `en ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `en ${hours} h`;
    const days = Math.round(hours / 24);
    return `en ${days} día${days > 1 ? 's' : ''}`;
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

  formatNextAvailable(iso: string | null): string {
    if (!iso) return 'sin turnos próximos';
    const date = this.parseIso(iso);
    const today = this.startOfToday();
    const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    if (diff === 0) return 'primer turno hoy';
    if (diff === 1) return 'primer turno mañana';
    return `próx. turno ${this.formatShortDay(date)}`;
  }

  isSlotSelected(iso: string, slot: AvailabilitySlot): boolean {
    const sel = this.store.selectedSlot();
    return (
      sel?.date === iso &&
      sel.slot.startTime === slot.startTime &&
      sel.slot.doctorId === slot.doctorId
    );
  }

  onCreatedNavigate(): void {
    void this.router.navigate([this.selfBooking() ? '/patient/appointments' : '/reception/agenda']);
  }

  requestNewPatient(): void {
    void this.router.navigate(['/reception/patients']);
  }

  cancel(): void {
    void this.router.navigate([this.selfBooking() ? '/patient/appointments' : '/reception/agenda']);
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private parseIso(iso: string): Date {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatLongDay(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  private formatShortDay(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(date);
  }
}
