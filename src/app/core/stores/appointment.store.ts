import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentResponse, AppointmentListParams } from '../models/appointment.model';
import { PagedResponse } from '../models/pagination.model';

interface AppointmentState {
  page: PagedResponse<AppointmentResponse> | null;
  filters: AppointmentListParams;
  loading: boolean;
}

export const AppointmentStore = signalStore(
  { providedIn: 'root' },
  withState<AppointmentState>({
    page: null,
    filters: { page: 0, size: 15 },
    loading: false,
  }),
  withMethods((store, service = inject(AppointmentService)) => ({
    async load(filters?: AppointmentListParams): Promise<void> {
      const merged = { ...store.filters(), ...filters };
      patchState(store, { loading: true, filters: merged });
      try {
        const res = await firstValueFrom(service.getList(merged));
        patchState(store, { page: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async cancel(id: number, reason: string): Promise<void> {
      await firstValueFrom(service.cancel(id, { reason }));
      const filters = store.filters();
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getList(filters));
        patchState(store, { page: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
