import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DoctorWorkspaceService } from '@core/services/doctor-workspace.service';
import { PrescriptionDocumentResponse } from '@core/models/doctor-workspace.model';

interface DoctorPrescriptionsState {
  documents: PrescriptionDocumentResponse[];
  total: number;
  page: number;
  last: boolean;
  q: string;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

export const DoctorPrescriptionsStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorPrescriptionsState>({
    documents: [],
    total: 0,
    page: 0,
    last: true,
    q: '',
    loading: false,
    loadingMore: false,
    error: null,
  }),
  withComputed((store) => ({
    isEmpty: computed(() => !store.loading() && store.documents().length === 0),
    canLoadMore: computed(() => !store.last() && !store.loadingMore()),
    totalMedications: computed(() =>
      store.documents().reduce((sum, doc) => sum + doc.items.length, 0),
    ),
  })),
  withMethods((store, service = inject(DoctorWorkspaceService)) => {
    async function fetchPage(page: number): Promise<void> {
      try {
        const res = await firstValueFrom(service.getPrescriptions({ q: store.q(), page }));
        const data = res.data;
        patchState(store, {
          documents: page === 0 ? data.content : [...store.documents(), ...data.content],
          total: data.totalElements,
          page: data.pageNumber,
          last: data.last,
          error: null,
        });
      } catch {
        patchState(store, { error: 'No se pudieron cargar tus recetas' });
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
    };
  }),
);
