import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { AppointmentResponse } from '@core/models/appointment.model';

interface PatientDashboardState {
  upcoming: AppointmentResponse[];
  completed: AppointmentResponse[];
  loading: boolean;
}

export const PatientDashboardStore = signalStore(
  { providedIn: 'root' },
  withState<PatientDashboardState>({
    upcoming: [],
    completed: [],
    loading: false,
  }),
  withComputed(({ upcoming, completed }) => ({
    nextAppointment: computed(() => upcoming()[0] ?? null),
    upcomingCount: computed(() => upcoming().length),
    completedCount: computed(() => completed().length),
  })),
  withMethods((store, service = inject(AppointmentService)) => ({
    async loadAll(): Promise<void> {
      if (store.loading()) return;
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getList({ size: 50, page: 0 }));
        const all = res.data.content;
        patchState(store, {
          upcoming: all.filter((a) => a.flowStatus === 'WAITING' || a.flowStatus === 'IN_PROCESS'),
          completed: all.filter((a) => a.flowStatus === 'COMPLETED'),
          loading: false,
        });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
