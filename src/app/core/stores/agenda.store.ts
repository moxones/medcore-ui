import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { BranchService } from '@core/services/branch.service';
import { DoctorService } from '@core/services/doctor.service';
import { CatalogService } from '@core/services/catalog.service';
import { AppointmentResponse, AppointmentFlowStatus } from '@core/models/appointment.model';
import { BranchResponse } from '@core/models/branch.model';
import { DoctorCardResponse } from '@core/models/doctor.model';
import { CatalogItemResponse, MasterCatalogItem } from '@core/models/catalog.model';

export const PX_PER_MIN = 1.2;
export const GRID_START_H = 7;
export const GRID_END_H = 20;
const MIN_CARD_H = 30;

export type VisualState = 'scheduled' | 'waiting' | 'in-process' | 'completed' | 'no-show' | 'cancelled';

export interface EnrichedAppointment extends AppointmentResponse {
  typeName: string;
  statusLabel: string;
  topPx: number;
  heightPx: number;
  visualState: VisualState;
  waitMinutes: number;
}

export interface DoctorColumn {
  doctorId: number;
  doctorName: string;
  specialties: string[];
  isInConsultation: boolean;
  appointments: EnrichedAppointment[];
}

interface AgendaState {
  date: string;
  branchId: number | null;
  filterDoctorId: number | null;
  filterVisualState: VisualState | null;
  appointments: AppointmentResponse[];
  branches: BranchResponse[];
  doctorCards: DoctorCardResponse[];
  appointmentTypes: CatalogItemResponse[];
  appointmentStatuses: MasterCatalogItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  currentTime: number;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function toTopPx(isoAt: string): number {
  const d = new Date(isoAt);
  const mins = d.getHours() * 60 + d.getMinutes() - GRID_START_H * 60;
  return Math.max(0, mins * PX_PER_MIN);
}

function toHeightPx(durationMinutes: number | null): number {
  return Math.max((durationMinutes ?? 30) * PX_PER_MIN, MIN_CARD_H);
}

function calcWaitMinutes(scheduledAt: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(scheduledAt).getTime()) / 60_000));
}

function deriveVisualState(appt: AppointmentResponse, codeById: Map<number, string>): VisualState {
  const code = (codeById.get(appt.statusId) ?? '').toUpperCase();
  if (code.includes('NO_SHOW') || code === 'NOSHOW') return 'no-show';
  if (code.includes('CANCEL')) return 'cancelled';
  if (appt.flowStatus === 'IN_PROCESS') return 'in-process';
  if (appt.flowStatus === 'WAITING') return 'waiting';
  if (appt.flowStatus === 'COMPLETED') return 'completed';
  return 'scheduled';
}

export const AgendaStore = signalStore(
  { providedIn: 'root' },
  withState<AgendaState>({
    date: todayIso(),
    branchId: null,
    filterDoctorId: null,
    filterVisualState: null,
    appointments: [],
    branches: [],
    doctorCards: [],
    appointmentTypes: [],
    appointmentStatuses: [],
    loading: false,
    refreshing: false,
    error: null,
    currentTime: Date.now(),
  }),
  withComputed((store) => {
    const typeNameById = computed(() =>
      new Map(store.appointmentTypes().map((t) => [t.id, t.name]))
    );
    const statusNameById = computed(() =>
      new Map(store.appointmentStatuses().map((s) => [s.id, s.name]))
    );
    const statusCodeById = computed(() =>
      new Map(store.appointmentStatuses().map((s) => [s.id, s.code]))
    );
    const doctorCardById = computed(() =>
      new Map(store.doctorCards().map((d) => [d.id, d]))
    );

    const allEnriched = computed((): EnrichedAppointment[] => {
      const now = store.currentTime();
      const codeMap = statusCodeById();
      const typeMap = typeNameById();
      const nameMap = statusNameById();
      return store.appointments().map((a) => {
        const state = deriveVisualState(a, codeMap);
        return {
          ...a,
          typeName: a.appointmentTypeId != null ? (typeMap.get(a.appointmentTypeId) ?? 'Consulta') : 'Consulta',
          statusLabel: nameMap.get(a.statusId) ?? 'Programada',
          topPx: toTopPx(a.scheduledAt),
          heightPx: toHeightPx(a.durationMinutes),
          visualState: state,
          waitMinutes: state === 'waiting' ? calcWaitMinutes(a.scheduledAt, now) : 0,
        };
      });
    });

    const filtered = computed(() => {
      const docId = store.filterDoctorId();
      const vs = store.filterVisualState();
      return allEnriched().filter((a) => {
        if (docId !== null && a.doctorId !== docId) return false;
        if (vs !== null && a.visualState !== vs) return false;
        return true;
      });
    });

    const doctorColumns = computed((): DoctorColumn[] => {
      const byDoc = new Map<number, EnrichedAppointment[]>();
      for (const a of filtered()) {
        const list = byDoc.get(a.doctorId) ?? [];
        list.push(a);
        byDoc.set(a.doctorId, list);
      }
      const cardMap = doctorCardById();
      return Array.from(byDoc.entries())
        .map(([doctorId, appts]) => {
          const card = cardMap.get(doctorId);
          const sorted = [...appts].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
          return {
            doctorId,
            doctorName: card?.fullName ?? appts[0]?.doctorName ?? `Médico #${doctorId}`,
            specialties: card?.specialties ?? [],
            isInConsultation: appts.some((a) => a.flowStatus === 'IN_PROCESS'),
            appointments: sorted,
          };
        })
        .sort((a, b) => a.doctorName.localeCompare(b.doctorName));
    });

    const waitingRoom = computed(() =>
      allEnriched()
        .filter((a) => a.flowStatus === 'WAITING')
        .sort((a, b) => b.waitMinutes - a.waitMinutes)
    );

    const next60Min = computed(() => {
      const now = store.currentTime();
      const in60 = now + 3_600_000;
      return allEnriched()
        .filter((a) => {
          const t = new Date(a.scheduledAt).getTime();
          return t > now && t <= in60 && a.flowStatus !== 'IN_PROCESS' && a.flowStatus !== 'COMPLETED';
        })
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    });

    const stats = computed(() => {
      const all = allEnriched();
      const now = store.currentTime();
      return {
        total: all.length,
        listed: all.filter((a) => a.visualState === 'scheduled').length,
        inProcess: all.filter((a) => a.visualState === 'in-process').length,
        waiting: all.filter((a) => a.visualState === 'waiting').length,
        upcoming: all.filter((a) => new Date(a.scheduledAt).getTime() > now && a.visualState === 'scheduled').length,
        noShow: all.filter((a) => a.visualState === 'no-show').length,
      };
    });

    const gridHeightPx = computed(() => (GRID_END_H - GRID_START_H) * 60 * PX_PER_MIN);

    const nowTopPx = computed(() => {
      const d = new Date(store.currentTime());
      const mins = d.getHours() * 60 + d.getMinutes() - GRID_START_H * 60;
      const total = (GRID_END_H - GRID_START_H) * 60;
      if (mins < 0 || mins > total) return -1;
      return mins * PX_PER_MIN;
    });

    const gridHours = computed(() =>
      Array.from({ length: GRID_END_H - GRID_START_H + 1 }, (_, i) => GRID_START_H + i)
    );

    return { allEnriched, doctorColumns, waitingRoom, next60Min, stats, gridHeightPx, nowTopPx, gridHours };
  }),
  withMethods((
    store,
    apptSvc = inject(AppointmentService),
    branchSvc = inject(BranchService),
    doctorSvc = inject(DoctorService),
    catalogSvc = inject(CatalogService),
  ) => {
    async function loadCalendar(): Promise<void> {
      patchState(store, { refreshing: true });
      try {
        const res = await firstValueFrom(
          apptSvc.getCalendar({
            startDate: store.date(),
            endDate: store.date(),
            branchId: store.branchId() ?? undefined,
          })
        );
        patchState(store, { appointments: res.data, error: null });
      } catch {
        patchState(store, { error: 'Error al cargar citas del día' });
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
        patchState(store, { loading: true, error: null });
        try {
          const [branchesRes, typesRes, statusesRes] = await Promise.all([
            firstValueFrom(branchSvc.getList({ page: 0, size: 50 })),
            firstValueFrom(catalogSvc.getClinicAppointmentTypes()),
            firstValueFrom(catalogSvc.getClinicAppointmentStatuses()),
          ]);
          const branches = branchesRes.data.content;
          const defaultBranchId = branches[0]?.id ?? null;
          patchState(store, {
            branches,
            appointmentTypes: typesRes.data,
            appointmentStatuses: statusesRes.data,
            branchId: defaultBranchId,
          });
          if (defaultBranchId !== null) {
            await loadDoctorCards(defaultBranchId);
          }
          await loadCalendar();
        } catch {
          patchState(store, { error: 'Error al inicializar la agenda' });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async refresh(): Promise<void> {
        await loadCalendar();
      },

      async setBranch(branchId: number): Promise<void> {
        patchState(store, { branchId, filterDoctorId: null, doctorCards: [] });
        await Promise.all([loadDoctorCards(branchId), loadCalendar()]);
      },

      setDate(date: string): void {
        patchState(store, { date });
        void loadCalendar();
      },

      setFilterDoctor(doctorId: number | null): void {
        patchState(store, { filterDoctorId: doctorId });
      },

      setFilterVisualState(state: VisualState | null): void {
        patchState(store, { filterVisualState: state });
      },

      async updateFlowStatus(id: number, flowStatus: AppointmentFlowStatus): Promise<void> {
        const updated = store.appointments().map((a) =>
          a.id === id ? { ...a, flowStatus } : a
        );
        patchState(store, { appointments: updated });
        try {
          await firstValueFrom(apptSvc.updateFlowStatus(id, { flowStatus }));
        } catch {
          await loadCalendar();
        }
      },
    };
  })
);
