import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PatientService } from '../services/patient.service';
import { PatientResponse, PatientSearchParams } from '../models/patient.model';
import { PagedResponse } from '../models/pagination.model';

interface PatientState {
  page: PagedResponse<PatientResponse> | null;
  params: PatientSearchParams;
  loading: boolean;
}

export const PatientStore = signalStore(
  { providedIn: 'root' },
  withState<PatientState>({
    page: null,
    params: { page: 0, size: 15 },
    loading: false,
  }),
  withMethods((store, service = inject(PatientService)) => ({
    async load(params?: PatientSearchParams): Promise<void> {
      const merged = { ...store.params(), ...params };
      patchState(store, { loading: true, params: merged });
      try {
        const res = await firstValueFrom(service.getList(merged));
        patchState(store, { page: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async search(query: string): Promise<void> {
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.search(query));
        patchState(store, { page: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },
  })),
);
