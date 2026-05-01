import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { AppointmentResponse } from '@core/models/appointment.model';

interface PatientDashboardState {
  upcoming: AppointmentResponse[];
  loading: boolean;
}

export const PatientDashboardStore = signalStore(
  { providedIn: 'root' },
  withState<PatientDashboardState>({
    upcoming: [],
    loading: false,
  }),
  withComputed(({ upcoming }) => ({
    nextAppointment: computed(() => upcoming()[0] ?? null),
    upcomingCount: computed(() => upcoming().length),
  })),
  withMethods((store, service = inject(AppointmentService)) => ({
    async loadUpcoming(): Promise<void> {
      if (store.loading() || store.upcoming().length > 0) return;
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getList({ size: 5, page: 0 }));
        patchState(store, { upcoming: res.data.content, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
