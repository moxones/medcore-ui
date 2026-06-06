import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { DoctorService } from '@core/services/doctor.service';
import { PatientService } from '@core/services/patient.service';
import { CatalogService } from '@core/services/catalog.service';
import { BranchService } from '@core/services/branch.service';
import { BranchContextStore } from '@core/stores/branch-context.store';
import {
  AppointmentResponse,
  BookingSource,
} from '@core/models/appointment.model';
import {
  AvailabilitySlot,
  BookingMode,
  DateRangeKey,
  DayAvailability,
  DayNavKey,
  SpecialtySummaryResponse,
  TimeOfDayKey,
} from '@core/models/availability.model';
import { DoctorCardResponse } from '@core/models/doctor.model';
import { BranchResponse } from '@core/models/branch.model';
import { CatalogItemResponse } from '@core/models/catalog.model';
import { PatientResponse } from '@core/models/patient.model';

interface SelectedSlot {
  date: string;
  slot: AvailabilitySlot;
}

interface BookingState {
  mode: BookingMode;
  selfBooking: boolean;
  patient: PatientResponse | null;
  patientQuery: string;
  patientResults: PatientResponse[];
  patientSearchLoading: boolean;
  branches: BranchResponse[];
  branchesLoading: boolean;
  selectedBranchId: number | null;
  specialties: SpecialtySummaryResponse[];
  specialtiesLoading: boolean;
  selectedSpecialtyId: number | null;
  specialtyDoctors: DoctorCardResponse[];
  doctorFilterId: number | null;
  doctorQuery: string;
  allDoctors: DoctorCardResponse[];
  doctorsLoading: boolean;
  selectedDoctor: DoctorCardResponse | null;
  dateRange: DateRangeKey;
  dayNav: DayNavKey;
  timeOfDay: TimeOfDayKey;
  appointmentTypes: CatalogItemResponse[];
  selectedTypeId: number | null;
  availability: DayAvailability[];
  availabilityLoading: boolean;
  selectedSlot: SelectedSlot | null;
  reason: string;
  bookingSource: BookingSource;
  submitting: boolean;
  submitError: string | null;
  createdAppointment: AppointmentResponse | null;
}

const RANGE_DAYS: Record<DateRangeKey, number> = {
  today: 1,
  next7: 7,
  next14: 14,
  next30: 30,
};

const initialState: BookingState = {
  mode: 'specialty',
  selfBooking: false,
  patient: null,
  patientQuery: '',
  patientResults: [],
  patientSearchLoading: false,
  branches: [],
  branchesLoading: false,
  selectedBranchId: null,
  specialties: [],
  specialtiesLoading: false,
  selectedSpecialtyId: null,
  specialtyDoctors: [],
  doctorFilterId: null,
  doctorQuery: '',
  allDoctors: [],
  doctorsLoading: false,
  selectedDoctor: null,
  dateRange: 'next7',
  dayNav: 'week',
  timeOfDay: 'all',
  appointmentTypes: [],
  selectedTypeId: null,
  availability: [],
  availabilityLoading: false,
  selectedSlot: null,
  reason: '',
  bookingSource: 'IN_PERSON',
  submitting: false,
  submitError: null,
  createdAppointment: null,
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isMorning(slot: AvailabilitySlot): boolean {
  return slot.startTime < '12:00';
}

function filterDay(day: DayAvailability, timeOfDay: TimeOfDayKey): DayAvailability {
  if (timeOfDay === 'all') return day;
  const slots = day.slots.filter((s) => (timeOfDay === 'morning' ? isMorning(s) : !isMorning(s)));
  return { date: day.date, slots };
}

export const AppointmentBookingStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const timeFilteredDays = computed(() =>
      store
        .availability()
        .map((day) => filterDay(day, store.timeOfDay()))
        .filter((day) => day.slots.length > 0),
    );

    return {
      timeFilteredDays,
      selectedBranch: computed(
        () => store.branches().find((b) => b.id === store.selectedBranchId()) ?? null,
      ),
      selectedSpecialty: computed(
        () => store.specialties().find((s) => s.id === store.selectedSpecialtyId()) ?? null,
      ),
      filteredDoctors: computed(() => {
        const q = store.doctorQuery().toLowerCase().trim();
        if (!q) return store.allDoctors();
        return store
          .allDoctors()
          .filter(
            (d) =>
              d.fullName.toLowerCase().includes(q) ||
              d.specialties.some((s) => s.toLowerCase().includes(q)),
          );
      }),
      visibleDays: computed(() => {
        const days = timeFilteredDays();
        const nav = store.dayNav();
        if (nav === 'week') return days;
        const target = toIso(nav === 'today' ? startOfToday() : addDays(startOfToday(), 1));
        return days.filter((d) => d.date === target);
      }),
      firstSlot: computed((): SelectedSlot | null => {
        const day = timeFilteredDays()[0];
        if (!day || day.slots.length === 0) return null;
        return { date: day.date, slot: day.slots[0] };
      }),
      totalSlots: computed(() =>
        timeFilteredDays().reduce((acc, day) => acc + day.slots.length, 0),
      ),
      patientInitials: computed(() => {
        const p = store.patient();
        if (!p) return '';
        return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
      }),
      canSubmit: computed(
        () =>
          store.patient() !== null &&
          store.selectedBranchId() !== null &&
          store.selectedSlot() !== null,
      ),
    };
  }),
  withMethods(
    (
      store,
      appointmentService = inject(AppointmentService),
      doctorService = inject(DoctorService),
      patientService = inject(PatientService),
      catalogService = inject(CatalogService),
      branchService = inject(BranchService),
      branchCtx = inject(BranchContextStore),
    ) => {
      let patientTimer: ReturnType<typeof setTimeout> | null = null;

      const horizon = (): { fromDate: string; toDate: string } => {
        const today = startOfToday();
        const span = RANGE_DAYS[store.dateRange()];
        return { fromDate: toIso(today), toDate: toIso(addDays(today, span - 1)) };
      };

      const refreshAvailability = async (): Promise<void> => {
        const branchId = store.selectedBranchId();
        const mode = store.mode();
        const specialtyId = store.selectedSpecialtyId();
        const doctor = store.selectedDoctor();
        const ready =
          branchId !== null && (mode === 'specialty' ? specialtyId !== null : doctor !== null);
        if (!ready || branchId === null) {
          patchState(store, { availability: [], selectedSlot: null });
          return;
        }
        patchState(store, { availabilityLoading: true });
        const { fromDate, toDate } = horizon();
        try {
          const res = await firstValueFrom(
            appointmentService.getAvailability({
              branchId,
              fromDate,
              toDate,
              ...(mode === 'specialty'
                ? {
                    specialtyId: specialtyId ?? undefined,
                    ...(store.doctorFilterId() ? { doctorId: store.doctorFilterId()! } : {}),
                  }
                : { doctorId: doctor!.id }),
              ...(store.selectedTypeId() ? { appointmentTypeId: store.selectedTypeId()! } : {}),
            }),
          );
          patchState(store, { availability: res.data, selectedSlot: null });
        } catch {
          patchState(store, { availability: [] });
        } finally {
          patchState(store, { availabilityLoading: false });
        }
      };

      const loadSpecialtyDoctors = async (): Promise<void> => {
        const branchId = store.selectedBranchId();
        const specialtyId = store.selectedSpecialtyId();
        if (branchId === null || specialtyId === null) {
          patchState(store, { specialtyDoctors: [] });
          return;
        }
        const res = await firstValueFrom(
          doctorService.getCardList({ isActive: true, branchId, specialtyId, size: 50 }),
        );
        patchState(store, { specialtyDoctors: res.data.content });
      };

      const loadBranchData = async (): Promise<void> => {
        const branchId = store.selectedBranchId();
        if (branchId === null) return;
        patchState(store, { specialtiesLoading: true });
        const [specialties, doctors] = await Promise.all([
          firstValueFrom(appointmentService.getSpecialtiesSummary(branchId))
            .then((res) => res.data)
            .catch(() => [] as SpecialtySummaryResponse[]),
          firstValueFrom(doctorService.getCardList({ isActive: true, branchId, size: 50 }))
            .then((res) => res.data.content)
            .catch(() => [] as DoctorCardResponse[]),
        ]);
        patchState(store, { specialties, allDoctors: doctors, specialtiesLoading: false });
      };

      return {
        async init(
          patient: PatientResponse | null,
          walkIn: boolean,
          selfBooking = false,
        ): Promise<void> {
          patchState(store, {
            patient,
            selfBooking,
            bookingSource: selfBooking ? 'SELF' : 'IN_PERSON',
            dayNav: walkIn ? 'today' : 'week',
            branchesLoading: true,
            doctorsLoading: true,
          });
          const [branchesRes, typesRes] = await Promise.all([
            firstValueFrom(branchService.getList({ size: 100 })),
            firstValueFrom(catalogService.getClinicAppointmentTypes()),
          ]);
          const branches = branchesRes.data.content;
          const activeBranchId = branchCtx.activeBranchId();
          const preselectedBranchId = branches.some((b) => b.id === activeBranchId)
            ? activeBranchId
            : (branches[0]?.id ?? null);
          patchState(store, {
            branches,
            branchesLoading: false,
            appointmentTypes: typesRes.data.filter((t) => t.activated),
            selectedBranchId: preselectedBranchId,
          });
          await loadBranchData();
          patchState(store, { doctorsLoading: false });
        },

        setMode(mode: BookingMode): void {
          if (store.mode() === mode) return;
          patchState(store, {
            mode,
            selectedSpecialtyId: null,
            doctorFilterId: null,
            specialtyDoctors: [],
            selectedDoctor: null,
            doctorQuery: '',
            availability: [],
            selectedSlot: null,
          });
        },

        async selectBranch(branchId: number): Promise<void> {
          if (store.selectedBranchId() === branchId) return;
          patchState(store, {
            selectedBranchId: branchId,
            selectedSpecialtyId: null,
            doctorFilterId: null,
            specialtyDoctors: [],
            selectedDoctor: null,
            availability: [],
            selectedSlot: null,
          });
          await loadBranchData();
        },

        async selectSpecialty(specialtyId: number): Promise<void> {
          patchState(store, {
            selectedSpecialtyId: store.selectedSpecialtyId() === specialtyId ? null : specialtyId,
            doctorFilterId: null,
          });
          await loadSpecialtyDoctors();
          await refreshAvailability();
        },

        async setDoctorFilter(doctorId: number | null): Promise<void> {
          if (store.doctorFilterId() === doctorId) return;
          patchState(store, { doctorFilterId: doctorId });
          await refreshAvailability();
        },

        async selectDoctor(doctor: DoctorCardResponse): Promise<void> {
          patchState(store, {
            selectedDoctor: store.selectedDoctor()?.id === doctor.id ? null : doctor,
            doctorQuery: '',
          });
          await refreshAvailability();
        },

        setDoctorQuery(query: string): void {
          patchState(store, { doctorQuery: query });
        },

        async setDateRange(range: DateRangeKey): Promise<void> {
          if (store.dateRange() === range) return;
          patchState(store, { dateRange: range });
          await refreshAvailability();
        },

        setDayNav(nav: DayNavKey): void {
          patchState(store, { dayNav: nav });
        },

        setTimeOfDay(value: TimeOfDayKey): void {
          patchState(store, { timeOfDay: value, selectedSlot: null });
        },

        async setType(typeId: number | null): Promise<void> {
          patchState(store, { selectedTypeId: typeId });
          await refreshAvailability();
        },

        selectSlot(date: string, slot: AvailabilitySlot): void {
          const current = store.selectedSlot();
          const same =
            current?.date === date &&
            current.slot.startTime === slot.startTime &&
            current.slot.doctorId === slot.doctorId;
          patchState(store, { selectedSlot: same ? null : { date, slot } });
        },

        setReason(value: string): void {
          patchState(store, { reason: value });
        },

        setBookingSource(value: BookingSource): void {
          patchState(store, { bookingSource: value });
        },

        onPatientQueryChange(query: string): void {
          patchState(store, { patientQuery: query });
          if (patientTimer) clearTimeout(patientTimer);
          if (query.trim().length < 2) {
            patchState(store, { patientResults: [], patientSearchLoading: false });
            return;
          }
          patchState(store, { patientSearchLoading: true });
          patientTimer = setTimeout(async () => {
            try {
              const res = await firstValueFrom(patientService.search(query.trim()));
              patchState(store, { patientResults: res.data });
            } finally {
              patchState(store, { patientSearchLoading: false });
            }
          }, 300);
        },

        selectPatient(patient: PatientResponse): void {
          patchState(store, { patient, patientQuery: '', patientResults: [] });
        },

        clearPatient(): void {
          patchState(store, { patient: null, patientQuery: '', patientResults: [] });
        },

        async submit(): Promise<void> {
          const selected = store.selectedSlot();
          const patient = store.patient();
          const branchId = store.selectedBranchId();
          if (!selected || !patient || branchId === null || store.submitting()) return;
          patchState(store, { submitting: true, submitError: null });
          try {
            const res = await firstValueFrom(
              appointmentService.create({
                patientId: patient.patientId,
                doctorId: selected.slot.doctorId,
                branchId,
                scheduledAt: `${selected.date}T${selected.slot.startTime}:00`,
                appointmentTypeId: store.selectedTypeId() ?? undefined,
                reason: store.reason().trim() || undefined,
                bookingSource: store.bookingSource(),
              }),
            );
            patchState(store, { createdAppointment: res.data });
          } catch {
            patchState(store, {
              submitError:
                'No se pudo confirmar la cita. El horario puede ya estar tomado. Elige otro.',
            });
          } finally {
            patchState(store, { submitting: false });
          }
        },

        resetForNext(): void {
          const keepPatient = store.selfBooking();
          patchState(store, {
            createdAppointment: null,
            selectedSlot: null,
            reason: '',
            submitError: null,
            ...(keepPatient ? {} : { patient: null, patientQuery: '', patientResults: [] }),
          });
        },
      };
    },
  ),
);
