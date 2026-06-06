import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DoctorDashboardService } from '@core/services/doctor-dashboard.service';
import { DoctorDashboardSummary } from '@core/models/doctor-dashboard.model';

interface DoctorDashboardState {
  summary: DoctorDashboardSummary | null;
  loading: boolean;
}

export const DoctorDashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorDashboardState>({
    summary: null,
    loading: false,
  }),
  withComputed(({ summary }) => ({
    agenda: computed(() => summary()?.agenda ?? []),
    recentPatients: computed(() => summary()?.recentPatients ?? []),
    nextPatient: computed(() => summary()?.nextPatient ?? null),
    progressPercent: computed(() => {
      const s = summary();
      if (!s || s.totalToday === 0) return 0;
      return Math.round((s.completedToday / s.totalToday) * 100);
    }),
  })),
  withMethods((store, service = inject(DoctorDashboardService)) => ({
    async load(): Promise<void> {
      if (store.loading()) return;
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getSummary());
        patchState(store, { summary: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
    async refresh(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getSummary());
        patchState(store, { summary: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
