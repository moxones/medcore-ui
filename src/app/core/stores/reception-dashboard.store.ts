import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { AppointmentResponse, AppointmentFlowStatus } from '@core/models/appointment.model';

interface ReceptionDashboardState {
  appointments: AppointmentResponse[];
  loading: boolean;
}

function sortByTime(a: AppointmentResponse, b: AppointmentResponse): number {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
}

export const ReceptionDashboardStore = signalStore(
  { providedIn: 'root' },
  withState<ReceptionDashboardState>({
    appointments: [],
    loading: false,
  }),
  withComputed(({ appointments }) => ({
    totalToday: computed(() => appointments().length),
    waiting: computed(() => appointments().filter((a) => a.flowStatus === 'WAITING').length),
    inConsultation: computed(
      () => appointments().filter((a) => a.flowStatus === 'IN_PROCESS').length,
    ),
    completed: computed(() => appointments().filter((a) => a.flowStatus === 'COMPLETED').length),
    activeQueue: computed(() =>
      appointments()
        .filter((a): a is AppointmentResponse =>
          a.flowStatus === 'WAITING' || a.flowStatus === 'IN_PROCESS',
        )
        .sort(sortByTime),
    ),
    completedList: computed(() =>
      appointments()
        .filter((a) => a.flowStatus === 'COMPLETED')
        .sort(sortByTime),
    ),
    progressPercent: computed(() => {
      const total = appointments().length;
      if (total === 0) return 0;
      const done = appointments().filter((a) => a.flowStatus === 'COMPLETED').length;
      return Math.round((done / total) * 100);
    }),
    doctorSummary: computed(() => {
      const map = new Map<number, { doctorId: number; doctorName: string; counts: Record<AppointmentFlowStatus, number> }>();
      for (const a of appointments()) {
        if (!map.has(a.doctorId)) {
          map.set(a.doctorId, {
            doctorId: a.doctorId,
            doctorName: a.doctorName,
            counts: { WAITING: 0, IN_PROCESS: 0, COMPLETED: 0 },
          });
        }
        map.get(a.doctorId)!.counts[a.flowStatus]++;
      }
      return [...map.values()].sort(
        (a, b) =>
          b.counts.WAITING + b.counts.IN_PROCESS + b.counts.COMPLETED -
          (a.counts.WAITING + a.counts.IN_PROCESS + a.counts.COMPLETED),
      );
    }),
  })),
  withMethods((store, service = inject(AppointmentService)) => ({
    async loadToday(): Promise<void> {
      if (store.loading()) return;
      patchState(store, { loading: true });
      const today = new Date().toISOString().split('T')[0];
      try {
        const res = await firstValueFrom(service.getList({ date: today, size: 100, page: 0 }));
        patchState(store, { appointments: res.data.content, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
    async refresh(): Promise<void> {
      patchState(store, { loading: true });
      const today = new Date().toISOString().split('T')[0];
      try {
        const res = await firstValueFrom(service.getList({ date: today, size: 100, page: 0 }));
        patchState(store, { appointments: res.data.content, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
