import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { DoctorService } from '@core/services/doctor.service';
import { AppointmentResponse } from '@core/models/appointment.model';

export type ScheduleView = 'week' | 'day';

export interface ScheduleDay {
  iso: string;
  weekday: string;
  dayNumber: number;
  month: string;
  isToday: boolean;
}

interface DoctorScheduleState {
  doctorId: number | null;
  weekStart: number;
  appointments: AppointmentResponse[];
  selectedDayIso: string;
  view: ScheduleView;
  loading: boolean;
  error: string | null;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayIso(): string {
  return localIso(new Date());
}

export const DoctorScheduleStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorScheduleState>({
    doctorId: null,
    weekStart: startOfWeek(new Date()).getTime(),
    appointments: [],
    selectedDayIso: todayIso(),
    view: 'week',
    loading: false,
    error: null,
  }),
  withComputed((store) => {
    const days = computed((): ScheduleDay[] => {
      const start = new Date(store.weekStart());
      const today = todayIso();
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const iso = localIso(d);
        return {
          iso,
          weekday: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d),
          dayNumber: d.getDate(),
          month: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d),
          isToday: iso === today,
        };
      });
    });

    const byDay = computed(() => {
      const map = new Map<string, AppointmentResponse[]>();
      for (const appt of store.appointments()) {
        const iso = appt.scheduledAt.slice(0, 10);
        const bucket = map.get(iso) ?? [];
        bucket.push(appt);
        map.set(iso, bucket);
      }
      for (const bucket of map.values()) {
        bucket.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      }
      return map;
    });

    const rangeLabel = computed(() => {
      const list = days();
      if (!list.length) return '';
      const first = new Date(store.weekStart());
      const last = new Date(store.weekStart());
      last.setDate(last.getDate() + 6);
      const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
      return `${fmt.format(first)} – ${fmt.format(last)}`;
    });

    const selectedDayAppointments = computed(() => byDay().get(store.selectedDayIso()) ?? []);

    const weekTotal = computed(() => store.appointments().length);

    return { days, byDay, rangeLabel, selectedDayAppointments, weekTotal };
  }),
  withMethods((
    store,
    apptSvc = inject(AppointmentService),
    doctorSvc = inject(DoctorService),
  ) => {
    async function loadWeek(): Promise<void> {
      const doctorId = store.doctorId();
      if (doctorId === null) return;
      patchState(store, { loading: true, error: null });
      const start = new Date(store.weekStart());
      const end = new Date(store.weekStart());
      end.setDate(end.getDate() + 6);
      try {
        const res = await firstValueFrom(
          apptSvc.getCalendar({
            startDate: localIso(start),
            endDate: localIso(end),
            doctorId,
          }),
        );
        patchState(store, { appointments: res.data, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar tu agenda' });
      }
    }

    return {
      async loadInit(): Promise<void> {
        patchState(store, { loading: true });
        try {
          if (store.doctorId() === null) {
            const me = await firstValueFrom(doctorSvc.getMe());
            patchState(store, { doctorId: me.data.id });
          }
          await loadWeek();
        } catch {
          patchState(store, { loading: false, error: 'No se pudo inicializar tu agenda' });
        }
      },

      async prevWeek(): Promise<void> {
        const start = new Date(store.weekStart());
        start.setDate(start.getDate() - 7);
        patchState(store, { weekStart: start.getTime() });
        await loadWeek();
      },

      async nextWeek(): Promise<void> {
        const start = new Date(store.weekStart());
        start.setDate(start.getDate() + 7);
        patchState(store, { weekStart: start.getTime() });
        await loadWeek();
      },

      async goToday(): Promise<void> {
        patchState(store, {
          weekStart: startOfWeek(new Date()).getTime(),
          selectedDayIso: todayIso(),
        });
        await loadWeek();
      },

      setView(view: ScheduleView): void {
        patchState(store, { view });
      },

      selectDay(iso: string): void {
        patchState(store, { selectedDayIso: iso, view: 'day' });
      },

      async refresh(): Promise<void> {
        await loadWeek();
      },
    };
  }),
);
