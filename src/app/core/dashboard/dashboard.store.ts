import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import {
  DashboardSummaryResponse,
  DoctorProductivityResponse,
} from '../models/dashboard.model';
import { firstValueFrom } from 'rxjs';

interface DashboardState {
  summary: DashboardSummaryResponse | null;
  productivity: DoctorProductivityResponse[];
  loading: boolean;
  loadingProductivity: boolean;
}

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>({
    summary: null,
    productivity: [],
    loading: false,
    loadingProductivity: false,
  }),
  withMethods((store, service = inject(DashboardService)) => ({
    async loadSummary(): Promise<void> {
      if (store.loading() || store.summary() !== null) return;
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getSummary());
        patchState(store, { summary: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async loadProductivity(): Promise<void> {
      if (store.loadingProductivity() || store.productivity().length > 0) return;
      patchState(store, { loadingProductivity: true });
      try {
        const res = await firstValueFrom(service.getProductivity());
        patchState(store, { productivity: res.data, loadingProductivity: false });
      } catch {
        patchState(store, { loadingProductivity: false });
      }
    },
  })),
);
