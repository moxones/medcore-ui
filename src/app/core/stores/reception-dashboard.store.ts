import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { AppointmentResponse, AppointmentFlowStatus } from '@core/models/appointment.model';

interface ReceptionDashboardState {
  appointments: AppointmentResponse[];
  loading: boolean;
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
      () => appointments().filter((a) => a.flowStatus === 'IN_CONSULTATION').length,
    ),
    completed: computed(() => appointments().filter((a) => a.flowStatus === 'COMPLETED').length),
    activeQueue: computed(() =>
      appointments().filter(
        (a) => a.flowStatus === 'WAITING' || a.flowStatus === 'IN_CONSULTATION',
      ),
    ),
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
  })),
);
