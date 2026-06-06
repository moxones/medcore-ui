import { computed, effect, inject, untracked } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { DoctorService } from '@core/services/doctor.service';
import { CatalogService } from '@core/services/catalog.service';
import { TriageService } from '@core/services/triage.service';
import { BranchContextStore } from '@core/stores/branch-context.store';
import { AppointmentResponse } from '@core/models/appointment.model';
import { DoctorCardResponse } from '@core/models/doctor.model';
import { CatalogItemResponse, MasterCatalogItem } from '@core/models/catalog.model';
import { CreateTriageRequest, TriageResponse, TriageSummaryResponse } from '@core/models/triage.model';

export type TriageStage = 'scheduled' | 'pending' | 'triaged' | 'passed';

export type TriageTab = 'queue' | 'scheduled' | 'passed' | 'all';

export interface TriagePatient extends AppointmentResponse {
  typeName: string;
  doctorShort: string;
  initials: string;
  stage: TriageStage;
  waitMinutes: number;
  overdue: boolean;
}

interface TriageState {
  branchId: number | null;
  doctorFilterId: number | null;
  searchTerm: string;
  tab: TriageTab;
  appointments: AppointmentResponse[];
  doctorCards: DoctorCardResponse[];
  appointmentTypes: CatalogItemResponse[];
  appointmentStatuses: MasterCatalogItem[];
  todayTriages: TriageSummaryResponse[];
  triagedIds: number[];
  selectedId: number | null;
  existingTriage: TriageResponse | null;
  loading: boolean;
  refreshing: boolean;
  loadingHistory: boolean;
  loadingTriage: boolean;
  savingTriage: boolean;
  actionPending: boolean;
  error: string | null;
  currentTime: number;
  lastRefreshAt: number;
}

export interface DoctorTriageLoad {
  doctorId: number;
  doctorName: string;
  initials: string;
  specialty: string | null;
  pending: number;
  triaged: number;
  scheduled: number;
}

const OVERDUE_WAIT_MINUTES = 20;

function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function minutesSince(iso: string | null, now: number): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

function shortDoctorName(fullName: string): string {
  const clean = fullName.replace(/^Dr[a]?\.\s*/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  return parts.slice(0, 2).join(' ') || fullName;
}

function patientInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function deriveStage(
  appt: AppointmentResponse,
  codeById: Map<number, string>,
  triaged: Set<number>,
): TriageStage | null {
  const code = (codeById.get(appt.statusId) ?? '').toUpperCase();
  if (code.includes('NO_SHOW') || code === 'NOSHOW' || code.includes('CANCEL')) return null;
  switch (appt.flowStatus) {
    case 'SCHEDULED':
      return 'scheduled';
    case 'WAITING':
      return triaged.has(appt.id) ? 'triaged' : 'pending';
    default:
      return 'passed';
  }
}

export const TriageStore = signalStore(
  { providedIn: 'root' },
  withState<TriageState>({
    branchId: null,
    doctorFilterId: null,
    searchTerm: '',
    tab: 'queue',
    appointments: [],
    doctorCards: [],
    appointmentTypes: [],
    appointmentStatuses: [],
    todayTriages: [],
    triagedIds: [],
    selectedId: null,
    existingTriage: null,
    loading: false,
    refreshing: false,
    loadingHistory: false,
    loadingTriage: false,
    savingTriage: false,
    actionPending: false,
    error: null,
    currentTime: Date.now(),
    lastRefreshAt: Date.now(),
  }),
  withComputed((store) => {
    const typeNameById = computed(() => new Map(store.appointmentTypes().map((t) => [t.id, t.name])));
    const statusCodeById = computed(() => new Map(store.appointmentStatuses().map((s) => [s.id, s.code])));
    const doctorCardById = computed(() => new Map(store.doctorCards().map((d) => [d.id, d])));

    const allPatients = computed((): TriagePatient[] => {
      const now = store.currentTime();
      const codeMap = statusCodeById();
      const typeMap = typeNameById();
      const triaged = new Set(store.triagedIds());
      const result: TriagePatient[] = [];
      for (const a of store.appointments()) {
        const stage = deriveStage(a, codeMap, triaged);
        if (stage === null) continue;
        const waitMinutes = minutesSince(a.checkedInAt ?? a.scheduledAt, now);
        result.push({
          ...a,
          typeName: a.appointmentTypeId != null ? (typeMap.get(a.appointmentTypeId) ?? 'Consulta') : 'Consulta',
          doctorShort: shortDoctorName(a.doctorName),
          initials: patientInitials(a.patientName),
          stage,
          waitMinutes,
          overdue: stage === 'pending' && waitMinutes > OVERDUE_WAIT_MINUTES,
        });
      }
      return result;
    });

    const doctorFiltered = computed(() => {
      const docId = store.doctorFilterId();
      if (docId === null) return allPatients();
      return allPatients().filter((p) => p.doctorId === docId);
    });

    const searched = computed(() => {
      const term = store.searchTerm().toLowerCase().trim();
      if (!term) return doctorFiltered();
      return doctorFiltered().filter((p) =>
        `${p.patientName} ${p.patientPhone} ${p.doctorName} ${p.typeName}`.toLowerCase().includes(term),
      );
    });

    const stats = computed(() => {
      const list = doctorFiltered();
      const pending = list.filter((p) => p.stage === 'pending');
      const waitingAll = list.filter((p) => p.stage === 'pending' || p.stage === 'triaged');
      const totalWait = waitingAll.reduce((sum, p) => sum + p.waitMinutes, 0);
      return {
        pending: pending.length,
        ready: list.filter((p) => p.stage === 'triaged').length,
        scheduled: list.filter((p) => p.stage === 'scheduled').length,
        passed: list.filter((p) => p.stage === 'passed').length,
        overdue: pending.filter((p) => p.overdue).length,
        avgWait: waitingAll.length ? Math.round(totalWait / waitingAll.length) : 0,
        longestWait: waitingAll.length ? Math.max(...waitingAll.map((p) => p.waitMinutes)) : 0,
      };
    });

    const tabCounts = computed(() => {
      const list = doctorFiltered();
      return {
        queue: list.filter((p) => p.stage === 'pending' || p.stage === 'triaged').length,
        scheduled: list.filter((p) => p.stage === 'scheduled').length,
        passed: list.filter((p) => p.stage === 'passed').length,
        all: list.length,
      };
    });

    const stageRank: Record<TriageStage, number> = { pending: 0, triaged: 1, scheduled: 2, passed: 3 };

    const visible = computed((): TriagePatient[] => {
      const tab = store.tab();
      const list = searched().filter((p) => {
        switch (tab) {
          case 'queue':
            return p.stage === 'pending' || p.stage === 'triaged';
          case 'scheduled':
            return p.stage === 'scheduled';
          case 'passed':
            return p.stage === 'passed';
          default:
            return true;
        }
      });
      return [...list].sort((a, b) => {
        const rank = stageRank[a.stage] - stageRank[b.stage];
        if (rank !== 0) return rank;
        if (a.stage === 'pending' || a.stage === 'triaged') return b.waitMinutes - a.waitMinutes;
        return a.scheduledAt.localeCompare(b.scheduledAt);
      });
    });

    const nextPending = computed((): TriagePatient | null => {
      const pending = doctorFiltered()
        .filter((p) => p.stage === 'pending')
        .sort((a, b) => b.waitMinutes - a.waitMinutes);
      return pending[0] ?? null;
    });

    const selected = computed((): TriagePatient | null => {
      const id = store.selectedId();
      if (id === null) return null;
      return allPatients().find((p) => p.id === id) ?? null;
    });

    const doctorsInQueue = computed((): DoctorCardResponse[] => {
      const ids = new Set(allPatients().map((p) => p.doctorId));
      return store.doctorCards().filter((d) => ids.has(d.id));
    });

    const isEmpty = computed(() => allPatients().length === 0);

    const byDoctor = computed((): DoctorTriageLoad[] => {
      const cardMap = doctorCardById();
      const map = new Map<number, DoctorTriageLoad>();
      for (const p of allPatients()) {
        const card = cardMap.get(p.doctorId);
        const entry = map.get(p.doctorId) ?? {
          doctorId: p.doctorId,
          doctorName: card?.fullName ?? p.doctorName,
          initials: card?.initials ?? p.initials,
          specialty: card?.specialties?.[0] ?? null,
          pending: 0,
          triaged: 0,
          scheduled: 0,
        };
        if (p.stage === 'pending') entry.pending += 1;
        else if (p.stage === 'triaged') entry.triaged += 1;
        else if (p.stage === 'scheduled') entry.scheduled += 1;
        map.set(p.doctorId, entry);
      }
      return Array.from(map.values())
        .filter((d) => d.pending + d.triaged + d.scheduled > 0)
        .sort((a, b) => b.pending - a.pending || b.triaged - a.triaged);
    });

    const triageStats = computed(() => {
      const list = store.todayTriages();
      return {
        completed: list.length,
        critical: list.filter((t) => t.urgencyLevel === 'CRITICAL').length,
        urgent: list.filter((t) => t.urgencyLevel === 'URGENT').length,
      };
    });

    const recentTriages = computed((): TriageSummaryResponse[] =>
      [...store.todayTriages()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );

    return {
      typeNameById,
      statusCodeById,
      allPatients,
      doctorFiltered,
      stats,
      tabCounts,
      visible,
      nextPending,
      selected,
      doctorsInQueue,
      isEmpty,
      byDoctor,
      triageStats,
      recentTriages,
    };
  }),
  withMethods((
    store,
    apptSvc = inject(AppointmentService),
    doctorSvc = inject(DoctorService),
    catalogSvc = inject(CatalogService),
    triageSvc = inject(TriageService),
    branchCtx = inject(BranchContextStore),
  ) => {
    async function loadAppointments(): Promise<void> {
      patchState(store, { refreshing: true });
      try {
        const today = localIso(new Date());
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

    async function loadTriages(): Promise<void> {
      patchState(store, { loadingHistory: true });
      try {
        const res = await firstValueFrom(triageSvc.getToday({ branchId: store.branchId() ?? undefined }));
        patchState(store, { todayTriages: res.data });
      } catch {
        patchState(store, { todayTriages: [] });
      } finally {
        patchState(store, { loadingHistory: false });
      }
    }

    async function applyFlow(id: number, flowStatus: AppointmentResponse['flowStatus']): Promise<boolean> {
      const current = store.appointments().find((a) => a.id === id);
      if (!current || current.flowStatus === flowStatus) return true;
      const updated = store.appointments().map((a) => (a.id === id ? { ...a, flowStatus } : a));
      patchState(store, { appointments: updated, actionPending: true });
      try {
        await firstValueFrom(apptSvc.updateFlowStatus(id, { flowStatus }));
        await loadAppointments();
        return true;
      } catch {
        patchState(store, { error: 'No se pudo actualizar el estado de la cita' });
        await loadAppointments();
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
          patchState(store, { error: 'No se pudo inicializar la estación de triaje' });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async refresh(): Promise<void> {
        await loadAppointments();
      },

      async loadTodayTriages(): Promise<void> {
        await loadTriages();
      },

      async setBranch(branchId: number): Promise<void> {
        if (store.branchId() === branchId) return;
        patchState(store, { branchId, doctorCards: [], doctorFilterId: null, selectedId: null });
        await Promise.all([loadDoctorCards(branchId), loadAppointments(), loadTriages()]);
      },

      setDoctorFilter(doctorId: number | null): void {
        patchState(store, { doctorFilterId: doctorId });
      },

      setSearch(term: string): void {
        patchState(store, { searchTerm: term });
      },

      setTab(tab: TriageTab): void {
        patchState(store, { tab });
      },

      async select(id: number): Promise<void> {
        patchState(store, { selectedId: id, existingTriage: null, error: null, loadingTriage: true });
        try {
          const res = await firstValueFrom(triageSvc.getLatestByAppointment(id));
          patchState(store, { existingTriage: res.data ?? null });
          if (res.data) {
            patchState(store, { triagedIds: Array.from(new Set([...store.triagedIds(), id])) });
          }
        } catch {
          patchState(store, { existingTriage: null });
        } finally {
          patchState(store, { loadingTriage: false });
        }
      },

      clearSelection(): void {
        patchState(store, { selectedId: null, existingTriage: null, error: null });
      },

      async registerArrival(id: number): Promise<boolean> {
        return applyFlow(id, 'WAITING');
      },

      async pass(id: number): Promise<boolean> {
        return applyFlow(id, 'CALLED');
      },

      async saveTriage(request: CreateTriageRequest, andPass: boolean): Promise<boolean> {
        patchState(store, { savingTriage: true, error: null });
        try {
          const res = await firstValueFrom(triageSvc.create(request));
          patchState(store, {
            existingTriage: res.data ?? null,
            triagedIds: Array.from(new Set([...store.triagedIds(), request.appointmentId])),
          });
          if (andPass) {
            const ok = await applyFlow(request.appointmentId, 'CALLED');
            if (!ok) return false;
          }
          await Promise.all([loadAppointments(), loadTriages()]);
          return true;
        } catch {
          patchState(store, { error: 'No se pudo guardar el triaje' });
          return false;
        } finally {
          patchState(store, { savingTriage: false });
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
