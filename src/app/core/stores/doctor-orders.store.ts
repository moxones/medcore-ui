import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DoctorWorkspaceService } from '@core/services/doctor-workspace.service';
import { DoctorOrderResponse } from '@core/models/doctor-workspace.model';
import { MedicalOrderStatus } from '@core/models/medical-record.model';

export type OrderFilter = 'ALL' | MedicalOrderStatus;

interface DoctorOrdersState {
  orders: DoctorOrderResponse[];
  filter: OrderFilter;
  loading: boolean;
  error: string | null;
}

export const DoctorOrdersStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorOrdersState>({
    orders: [],
    filter: 'ALL',
    loading: false,
    error: null,
  }),
  withComputed((store) => ({
    visible: computed(() => {
      const filter = store.filter();
      const all = store.orders();
      if (filter === 'ALL') return all;
      return all.filter((o) => o.status === filter);
    }),
    counts: computed(() => {
      const all = store.orders();
      return {
        all: all.length,
        requested: all.filter((o) => o.status === 'REQUESTED').length,
        inProgress: all.filter((o) => o.status === 'IN_PROGRESS').length,
        completed: all.filter((o) => o.status === 'COMPLETED').length,
      };
    }),
    isEmpty: computed(() => !store.loading() && store.orders().length === 0),
  })),
  withMethods((store, service = inject(DoctorWorkspaceService)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await firstValueFrom(service.getOrders());
        patchState(store, { orders: res.data, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudieron cargar tus órdenes' });
      }
    },
    setFilter(filter: OrderFilter): void {
      patchState(store, { filter });
    },
  })),
);
