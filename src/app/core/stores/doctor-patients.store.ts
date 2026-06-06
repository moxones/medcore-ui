import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DoctorWorkspaceService } from '@core/services/doctor-workspace.service';
import { DoctorPatientResponse } from '@core/models/doctor-workspace.model';

interface DoctorPatientsState {
  patients: DoctorPatientResponse[];
  total: number;
  page: number;
  size: number;
  last: boolean;
  q: string;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

export const DoctorPatientsStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorPatientsState>({
    patients: [],
    total: 0,
    page: 0,
    size: 24,
    last: true,
    q: '',
    loading: false,
    loadingMore: false,
    error: null,
  }),
  withComputed((store) => ({
    isEmpty: computed(() => !store.loading() && store.patients().length === 0),
    canLoadMore: computed(() => !store.last() && !store.loadingMore()),
  })),
  withMethods((store, service = inject(DoctorWorkspaceService)) => {
    async function fetchPage(page: number): Promise<void> {
      try {
        const res = await firstValueFrom(
          service.getPatients({ q: store.q(), page, size: store.size() }),
        );
        const data = res.data;
        patchState(store, {
          patients: page === 0 ? data.content : [...store.patients(), ...data.content],
          total: data.totalElements,
          page: data.pageNumber,
          last: data.last,
          error: null,
        });
      } catch {
        patchState(store, { error: 'No se pudieron cargar tus pacientes' });
      }
    }

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true });
        await fetchPage(0);
        patchState(store, { loading: false });
      },

      async setSearch(q: string): Promise<void> {
        patchState(store, { q, loading: true });
        await fetchPage(0);
        patchState(store, { loading: false });
      },

      async loadMore(): Promise<void> {
        if (store.last() || store.loadingMore()) return;
        patchState(store, { loadingMore: true });
        await fetchPage(store.page() + 1);
        patchState(store, { loadingMore: false });
      },

      async refresh(): Promise<void> {
        await fetchPage(0);
      },
    };
  }),
);
