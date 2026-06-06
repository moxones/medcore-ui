import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { TriageService } from '@core/services/triage.service';
import { DoctorService } from '@core/services/doctor.service';
import { AppointmentResponse, AppointmentFlowStatus } from '@core/models/appointment.model';
import { TriageSummaryResponse, UrgencyLevel } from '@core/models/triage.model';

export type TodayFilter = 'all' | 'ready' | 'inConsult' | 'done';

export type TodayVisualState = 'scheduled' | 'waiting' | 'called' | 'in-process' | 'done';

export interface TodayPatient extends AppointmentResponse {
  typeName: string;
  visualState: TodayVisualState;
  urgency: UrgencyLevel;
  waitMinutes: number;
  triage: TriageSummaryResponse | null;
}

interface DoctorTodayState {
  doctorId: number | null;
  appointments: AppointmentResponse[];
  triage: TriageSummaryResponse[];
  searchTerm: string;
  filter: TodayFilter;
  loading: boolean;
  refreshing: boolean;
  actionPending: boolean;
  error: string | null;
  currentTime: number;
  selectedId: number | null;
}

const URGENCY_WEIGHT: Record<UrgencyLevel, number> = { CRITICAL: 3, URGENT: 2, NORMAL: 1 };

const GROUP_RANK: Record<TodayVisualState, number> = {
  waiting: 0,
  called: 0,
  'in-process': 1,
  scheduled: 2,
  done: 3,
};

function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayIso(): string {
  return localIso(new Date());
}

function minutesSince(iso: string | null, now: number): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

function deriveVisualState(flowStatus: AppointmentFlowStatus): TodayVisualState {
  switch (flowStatus) {
    case 'WAITING': return 'waiting';
    case 'CALLED': return 'called';
    case 'IN_PROCESS': return 'in-process';
    case 'PENDING_PAYMENT':
    case 'COMPLETED': return 'done';
    default: return 'scheduled';
  }
}

function waitAnchor(appt: AppointmentResponse, state: TodayVisualState): string | null {
  switch (state) {
    case 'waiting': return appt.checkedInAt ?? appt.scheduledAt;
    case 'called': return appt.calledAt ?? appt.checkedInAt ?? appt.scheduledAt;
    case 'in-process': return appt.startedAt ?? appt.scheduledAt;
    default: return null;
  }
}

function compareTodayPatients(a: TodayPatient, b: TodayPatient): number {
  const rankDiff = GROUP_RANK[a.visualState] - GROUP_RANK[b.visualState];
  if (rankDiff !== 0) return rankDiff;
  if (GROUP_RANK[a.visualState] === 0) {
    const urgencyDiff = URGENCY_WEIGHT[b.urgency] - URGENCY_WEIGHT[a.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return b.waitMinutes - a.waitMinutes;
  }
  if (a.visualState === 'done') {
    return (b.completedAt ?? b.scheduledAt).localeCompare(a.completedAt ?? a.scheduledAt);
  }
  return a.scheduledAt.localeCompare(b.scheduledAt);
}

export const DoctorTodayStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorTodayState>({
    doctorId: null,
    appointments: [],
    triage: [],
    searchTerm: '',
    filter: 'all',
    loading: false,
    refreshing: false,
    actionPending: false,
    error: null,
    currentTime: Date.now(),
    selectedId: null,
  }),
  withComputed((store) => {
    const triageByAppointment = computed(
      () => new Map(store.triage().map((t) => [t.appointmentId, t])),
    );

    const patients = computed((): TodayPatient[] => {
      const now = store.currentTime();
      const triageMap = triageByAppointment();
      return store
        .appointments()
        .map((a) => {
          const triage = triageMap.get(a.id) ?? null;
          const visualState = deriveVisualState(a.flowStatus);
          return {
            ...a,
            typeName: triage?.appointmentTypeName ?? 'Consulta',
            visualState,
            urgency: triage?.urgencyLevel ?? 'NORMAL',
            waitMinutes: minutesSince(waitAnchor(a, visualState), now),
            triage,
          };
        })
        .sort(compareTodayPatients);
    });

    const matchesFilter = computed(() => {
      const filter = store.filter();
      return (p: TodayPatient): boolean => {
        if (filter === 'all') return true;
        if (filter === 'ready') return p.visualState === 'waiting' || p.visualState === 'called';
        if (filter === 'inConsult') return p.visualState === 'in-process';
        return p.visualState === 'done';
      };
    });

    const matchesSearch = computed(() => {
      const term = store.searchTerm().toLowerCase().trim();
      return (p: TodayPatient): boolean => {
        if (!term) return true;
        return `${p.patientName} ${p.typeName}`.toLowerCase().includes(term);
      };
    });

    const visible = computed(() => patients().filter((p) => matchesFilter()(p) && matchesSearch()(p)));

    const stats = computed(() => {
      const all = patients();
      return {
        total: all.length,
        ready: all.filter((p) => p.visualState === 'waiting' || p.visualState === 'called').length,
        inConsult: all.filter((p) => p.visualState === 'in-process').length,
        done: all.filter((p) => p.visualState === 'done').length,
      };
    });

    const selected = computed((): TodayPatient | null => {
      const id = store.selectedId();
      if (id === null) return null;
      return patients().find((p) => p.id === id) ?? null;
    });

    const isEmpty = computed(() => store.appointments().length === 0);

    return { triageByAppointment, patients, visible, stats, selected, isEmpty };
  }),
  withMethods((
    store,
    apptSvc = inject(AppointmentService),
    triageSvc = inject(TriageService),
    doctorSvc = inject(DoctorService),
  ) => {
    async function loadData(): Promise<void> {
      const doctorId = store.doctorId();
      if (doctorId === null) return;
      patchState(store, { refreshing: true });
      try {
        const date = todayIso();
        const [calendarRes, triageRes] = await Promise.all([
          firstValueFrom(apptSvc.getCalendar({ startDate: date, endDate: date, doctorId })),
          firstValueFrom(triageSvc.getToday({ doctorId, date })),
        ]);
        patchState(store, {
          appointments: calendarRes.data,
          triage: triageRes.data,
          error: null,
        });
      } catch {
        patchState(store, { error: 'No se pudieron cargar tus pacientes de hoy' });
      } finally {
        patchState(store, { refreshing: false });
      }
    }

    async function applyFlow(id: number, flowStatus: AppointmentFlowStatus): Promise<boolean> {
      const current = store.appointments().find((a) => a.id === id);
      if (!current || current.flowStatus === flowStatus) return true;
      const optimistic = store.appointments().map((a) => (a.id === id ? { ...a, flowStatus } : a));
      patchState(store, { appointments: optimistic, actionPending: true, error: null });
      try {
        await firstValueFrom(apptSvc.updateFlowStatus(id, { flowStatus }));
        await loadData();
        return true;
      } catch {
        patchState(store, { error: 'No se pudo actualizar el estado del paciente' });
        await loadData();
        return false;
      } finally {
        patchState(store, { actionPending: false });
      }
    }

    return {
      tick(): void {
        patchState(store, { currentTime: Date.now() });
      },

      async loadInit(): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          if (store.doctorId() === null) {
            const me = await firstValueFrom(doctorSvc.getMe());
            patchState(store, { doctorId: me.data.id });
          }
          await loadData();
        } catch {
          patchState(store, { error: 'No se pudo inicializar tu jornada' });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async refresh(): Promise<void> {
        await loadData();
      },

      setSearch(term: string): void {
        patchState(store, { searchTerm: term });
      },

      setFilter(filter: TodayFilter): void {
        patchState(store, { filter });
      },

      select(id: number): void {
        patchState(store, { selectedId: id });
      },

      clearSelection(): void {
        patchState(store, { selectedId: null });
      },

      async call(id: number): Promise<boolean> {
        return applyFlow(id, 'CALLED');
      },

      async startConsultation(id: number): Promise<boolean> {
        return applyFlow(id, 'IN_PROCESS');
      },
    };
  }),
);
