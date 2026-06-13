import { computed, effect, inject, untracked } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { DoctorService } from '@core/services/doctor.service';
import { CatalogService } from '@core/services/catalog.service';
import { BranchContextStore } from '@core/stores/branch-context.store';
import { ProcessConfigStore } from '@core/stores/process-config.store';
import { AppointmentResponse, AppointmentFlowStatus } from '@core/models/appointment.model';
import { DoctorCardResponse } from '@core/models/doctor.model';
import { CatalogItemResponse, MasterCatalogItem } from '@core/models/catalog.model';

export type QueueColumnId = 'toArrive' | 'waiting' | 'called' | 'inConsult' | 'toBill' | 'finished';

export type QueueVisualState =
  | 'scheduled'
  | 'waiting'
  | 'called'
  | 'in-process'
  | 'pending-payment'
  | 'completed'
  | 'no-show'
  | 'cancelled';

export const QUEUE_COLUMN_FLOW: Record<Exclude<QueueColumnId, 'toArrive'>, AppointmentFlowStatus> = {
  waiting: 'WAITING',
  called: 'CALLED',
  inConsult: 'IN_PROCESS',
  toBill: 'PENDING_PAYMENT',
  finished: 'COMPLETED',
};

export interface QueuePatient extends AppointmentResponse {
  typeName: string;
  statusLabel: string;
  visualState: QueueVisualState;
  column: QueueColumnId;
  elapsedMinutes: number;
  overdue: boolean;
}

export interface QueueColumn {
  id: QueueColumnId;
  label: string;
  icon: string;
  patients: QueuePatient[];
}

export interface DoctorStatus {
  doctorId: number;
  doctorName: string;
  initials: string;
  specialty: string | null;
  inConsultation: boolean;
  currentPatient: string | null;
  consultingMinutes: number;
  waitingCount: number;
  toArriveCount: number;
}

interface QueueState {
  branchId: number | null;
  searchTerm: string;
  appointments: AppointmentResponse[];
  doctorCards: DoctorCardResponse[];
  appointmentTypes: CatalogItemResponse[];
  appointmentStatuses: MasterCatalogItem[];
  loading: boolean;
  refreshing: boolean;
  actionPending: boolean;
  error: string | null;
  currentTime: number;
  selectedId: number | null;
  lastRefreshAt: number;
}

const OVERDUE_WAIT_MINUTES = 15;

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

function deriveVisualState(appt: AppointmentResponse, codeById: Map<number, string>): QueueVisualState {
  const code = (codeById.get(appt.statusId) ?? '').toUpperCase();
  if (code.includes('NO_SHOW') || code === 'NOSHOW') return 'no-show';
  if (code.includes('CANCEL')) return 'cancelled';
  switch (appt.flowStatus) {
    case 'WAITING': return 'waiting';
    case 'CALLED': return 'called';
    case 'IN_PROCESS': return 'in-process';
    case 'PENDING_PAYMENT': return 'pending-payment';
    case 'COMPLETED': return 'completed';
    default: return 'scheduled';
  }
}

const STATE_COLUMN: Record<QueueVisualState, QueueColumnId | null> = {
  'scheduled': 'toArrive',
  'waiting': 'waiting',
  'called': 'called',
  'in-process': 'inConsult',
  'pending-payment': 'toBill',
  'completed': 'finished',
  'no-show': null,
  'cancelled': null,
};

function anchorTimestamp(appt: AppointmentResponse, state: QueueVisualState): string | null {
  switch (state) {
    case 'waiting': return appt.checkedInAt ?? appt.scheduledAt;
    case 'called': return appt.calledAt ?? appt.scheduledAt;
    case 'in-process': return appt.startedAt ?? appt.scheduledAt;
    case 'pending-payment': return appt.finishedAt ?? appt.scheduledAt;
    default: return null;
  }
}

function firstName(fullName: string): string {
  return fullName.replace(/^Dr[a]?\.\s*/i, '').split(' ')[0] ?? fullName;
}

export const QueueStore = signalStore(
  { providedIn: 'root' },
  withState<QueueState>({
    branchId: null,
    searchTerm: '',
    appointments: [],
    doctorCards: [],
    appointmentTypes: [],
    appointmentStatuses: [],
    loading: false,
    refreshing: false,
    actionPending: false,
    error: null,
    currentTime: Date.now(),
    selectedId: null,
    lastRefreshAt: Date.now(),
  }),
  withComputed((store, processConfig = inject(ProcessConfigStore)) => {
    const typeNameById = computed(() => new Map(store.appointmentTypes().map((t) => [t.id, t.name])));
    const statusNameById = computed(() => new Map(store.appointmentStatuses().map((s) => [s.id, s.name])));
    const statusCodeById = computed(() => new Map(store.appointmentStatuses().map((s) => [s.id, s.code])));
    const doctorCardById = computed(() => new Map(store.doctorCards().map((d) => [d.id, d])));

    const allPatients = computed((): QueuePatient[] => {
      const now = store.currentTime();
      const codeMap = statusCodeById();
      const typeMap = typeNameById();
      const nameMap = statusNameById();
      return store.appointments().map((a) => {
        const state = deriveVisualState(a, codeMap);
        const column = STATE_COLUMN[state] ?? 'toArrive';
        const elapsedMinutes = minutesSince(anchorTimestamp(a, state), now);
        return {
          ...a,
          typeName: a.appointmentTypeId != null ? (typeMap.get(a.appointmentTypeId) ?? 'Consulta') : 'Consulta',
          statusLabel: nameMap.get(a.statusId) ?? 'Programada',
          visualState: state,
          column,
          elapsedMinutes,
          overdue: state === 'waiting' && elapsedMinutes > OVERDUE_WAIT_MINUTES,
        };
      });
    });

    const matchesSearch = computed(() => {
      const term = store.searchTerm().toLowerCase().trim();
      return (p: QueuePatient): boolean => {
        if (!term) return true;
        return `${p.patientName} ${p.doctorName} ${p.typeName}`.toLowerCase().includes(term);
      };
    });

    const active = computed(() =>
      allPatients().filter((p) => p.visualState !== 'no-show' && p.visualState !== 'cancelled'),
    );

    const visible = computed(() => active().filter(matchesSearch()));

    const byColumn = computed((): Record<QueueColumnId, QueuePatient[]> => {
      const buckets: Record<QueueColumnId, QueuePatient[]> = {
        toArrive: [],
        waiting: [],
        called: [],
        inConsult: [],
        toBill: [],
        finished: [],
      };
      for (const p of visible()) buckets[p.column].push(p);
      buckets.toArrive.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      buckets.waiting.sort((a, b) => b.elapsedMinutes - a.elapsedMinutes);
      buckets.called.sort((a, b) => b.elapsedMinutes - a.elapsedMinutes);
      buckets.inConsult.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      buckets.toBill.sort((a, b) => b.elapsedMinutes - a.elapsedMinutes);
      buckets.finished.sort((a, b) => (b.completedAt ?? b.scheduledAt).localeCompare(a.completedAt ?? a.scheduledAt));
      return buckets;
    });

    const columns = computed((): QueueColumn[] => {
      const buckets = byColumn();
      const showCalled = processConfig.calledEnabled() || buckets.called.length > 0;
      const showToBill = processConfig.paymentEnabled() || buckets.toBill.length > 0;
      const all: QueueColumn[] = [
        { id: 'toArrive', label: 'Por llegar', icon: 'event_upcoming', patients: buckets.toArrive },
        { id: 'waiting', label: 'En espera', icon: 'airline_seat_recline_normal', patients: buckets.waiting },
        { id: 'called', label: 'Llamados', icon: 'campaign', patients: buckets.called },
        { id: 'inConsult', label: 'En consulta', icon: 'medical_services', patients: buckets.inConsult },
        { id: 'toBill', label: 'Por cobrar', icon: 'payments', patients: buckets.toBill },
        { id: 'finished', label: 'Finalizadas', icon: 'task_alt', patients: buckets.finished },
      ];
      return all.filter((col) => {
        if (col.id === 'called') return showCalled;
        if (col.id === 'toBill') return showToBill;
        return true;
      });
    });

    const doctorStatuses = computed((): DoctorStatus[] => {
      const now = store.currentTime();
      const cardMap = doctorCardById();
      const byDoc = new Map<number, QueuePatient[]>();
      for (const p of active()) {
        const list = byDoc.get(p.doctorId) ?? [];
        list.push(p);
        byDoc.set(p.doctorId, list);
      }
      return Array.from(byDoc.entries())
        .map(([doctorId, list]) => {
          const card = cardMap.get(doctorId);
          const consulting = list.find((p) => p.visualState === 'in-process') ?? null;
          return {
            doctorId,
            doctorName: card?.fullName ?? list[0]?.doctorName ?? `Médico #${doctorId}`,
            initials: card?.initials ?? (list[0]?.doctorName ?? 'M').slice(0, 2).toUpperCase(),
            specialty: card?.specialties?.[0] ?? null,
            inConsultation: consulting !== null,
            currentPatient: consulting ? firstName(consulting.patientName) : null,
            consultingMinutes: consulting ? consulting.elapsedMinutes : 0,
            waitingCount: list.filter((p) => p.visualState === 'waiting').length,
            toArriveCount: list.filter((p) => p.visualState === 'scheduled').length,
          };
        })
        .sort((a, b) => Number(b.inConsultation) - Number(a.inConsultation) || a.doctorName.localeCompare(b.doctorName));
    });

    const stats = computed(() => {
      const buckets = byColumn();
      const waiting = buckets.waiting;
      const totalWait = waiting.reduce((sum, p) => sum + p.elapsedMinutes, 0);
      return {
        total: active().length,
        toArrive: buckets.toArrive.length,
        waiting: waiting.length,
        called: buckets.called.length,
        inConsult: buckets.inConsult.length,
        toBill: buckets.toBill.length,
        finished: buckets.finished.length,
        avgWait: waiting.length ? Math.round(totalWait / waiting.length) : 0,
        longestWait: waiting.length ? Math.max(...waiting.map((p) => p.elapsedMinutes)) : 0,
      };
    });

    const selected = computed((): QueuePatient | null => {
      const id = store.selectedId();
      if (id === null) return null;
      return allPatients().find((p) => p.id === id) ?? null;
    });

    const isEmpty = computed(() => active().length === 0);

    return { allPatients, active, visible, byColumn, columns, doctorStatuses, stats, selected, isEmpty };
  }),
  withMethods((
    store,
    apptSvc = inject(AppointmentService),
    doctorSvc = inject(DoctorService),
    catalogSvc = inject(CatalogService),
    branchCtx = inject(BranchContextStore),
  ) => {
    async function loadAppointments(): Promise<void> {
      patchState(store, { refreshing: true });
      try {
        const today = todayIso();
        const res = await firstValueFrom(
          apptSvc.getCalendar({ startDate: today, endDate: today, branchId: store.branchId() ?? undefined }),
        );
        patchState(store, { appointments: res.data, error: null, lastRefreshAt: Date.now() });
      } catch {
        patchState(store, { error: 'No se pudieron cargar las citas de hoy' });
      } finally {
        patchState(store, { refreshing: false });
      }
    }

    async function loadDoctorCards(branchId: number): Promise<void> {
      try {
        const res = await firstValueFrom(doctorSvc.getCardList({ branchId, size: 200, page: 0, isActive: true }));
        patchState(store, { doctorCards: res.data.content });
      } catch {
        patchState(store, { doctorCards: [] });
      }
    }

    return {
      tick(): void {
        patchState(store, { currentTime: Date.now() });
      },

      async loadInit(): Promise<void> {
        patchState(store, { loading: true, error: null, branchId: branchCtx.activeBranchId() });
        try {
          const [typesRes, statusesRes] = await Promise.all([
            firstValueFrom(catalogSvc.getClinicAppointmentTypes()),
            firstValueFrom(catalogSvc.getClinicAppointmentStatuses()),
          ]);
          patchState(store, {
            appointmentTypes: typesRes.data,
            appointmentStatuses: statusesRes.data,
          });
          const branchId = store.branchId();
          if (branchId !== null) await loadDoctorCards(branchId);
          await loadAppointments();
        } catch {
          patchState(store, { error: 'No se pudo inicializar la sala de espera' });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async refresh(): Promise<void> {
        await loadAppointments();
      },

      async setBranch(branchId: number): Promise<void> {
        if (store.branchId() === branchId) return;
        patchState(store, { branchId, doctorCards: [], selectedId: null });
        await Promise.all([loadDoctorCards(branchId), loadAppointments()]);
      },

      setSearch(term: string): void {
        patchState(store, { searchTerm: term });
      },

      select(id: number): void {
        patchState(store, { selectedId: id, error: null });
      },

      clearSelection(): void {
        patchState(store, { selectedId: null, error: null });
      },

      async setFlow(id: number, flowStatus: AppointmentFlowStatus): Promise<void> {
        const current = store.appointments().find((a) => a.id === id);
        if (!current || current.flowStatus === flowStatus) return;
        const updated = store.appointments().map((a) => (a.id === id ? { ...a, flowStatus } : a));
        patchState(store, { appointments: updated, actionPending: true });
        try {
          await firstValueFrom(apptSvc.updateFlowStatus(id, { flowStatus }));
          await loadAppointments();
        } catch {
          patchState(store, { error: 'No se pudo actualizar el estado' });
          await loadAppointments();
        } finally {
          patchState(store, { actionPending: false });
        }
      },

      async moveTo(id: number, column: QueueColumnId): Promise<void> {
        if (column === 'toArrive') return;
        const target = QUEUE_COLUMN_FLOW[column];
        const current = store.appointments().find((a) => a.id === id);
        if (!current || current.flowStatus === target) return;
        const updated = store.appointments().map((a) => (a.id === id ? { ...a, flowStatus: target } : a));
        patchState(store, { appointments: updated, actionPending: true });
        try {
          await firstValueFrom(apptSvc.updateFlowStatus(id, { flowStatus: target }));
          await loadAppointments();
        } catch {
          patchState(store, { error: 'Movimiento no permitido para esta cita' });
          await loadAppointments();
        } finally {
          patchState(store, { actionPending: false });
        }
      },

      async cancelAppointment(id: number, reason: string): Promise<boolean> {
        patchState(store, { actionPending: true, error: null });
        try {
          await firstValueFrom(apptSvc.cancel(id, { reason }));
          await loadAppointments();
          return true;
        } catch {
          patchState(store, { error: 'No se pudo cancelar la cita' });
          return false;
        } finally {
          patchState(store, { actionPending: false });
        }
      },

      async reschedule(id: number, newScheduledAt: string): Promise<boolean> {
        patchState(store, { actionPending: true, error: null });
        try {
          await firstValueFrom(apptSvc.reschedule(id, { newScheduledAt }));
          await loadAppointments();
          return true;
        } catch {
          patchState(store, { error: 'No se pudo reprogramar la cita' });
          return false;
        } finally {
          patchState(store, { actionPending: false });
        }
      },
    };
  }),
  withHooks({
    onInit(store, branchCtx = inject(BranchContextStore)) {
      effect(() => {
        const id = branchCtx.activeBranchId();
        if (id === null) return;
        untracked(() => void store.setBranch(id));
      });
    },
  }),
);
