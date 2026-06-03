import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PatientService } from '../services/patient.service';
import { PatientResponse, PatientSearchParams, CreatePatientRequest, UpdatePatientRequest } from '../models/patient.model';
import { PagedResponse } from '../models/pagination.model';

interface PatientState {
  page: PagedResponse<PatientResponse> | null;
  params: PatientSearchParams;
  loading: boolean;
  saving: boolean;
}

export const PatientStore = signalStore(
  { providedIn: 'root' },
  withState<PatientState>({
    page: null,
    params: { page: 0, size: 15 },
    loading: false,
    saving: false,
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
        const content = res.data;
        patchState(store, {
          page: {
            content,
            totalElements: content.length,
            totalPages: 1,
            pageNumber: 0,
            pageSize: content.length,
            last: true,
          },
          loading: false,
        });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async update(id: number, data: UpdatePatientRequest): Promise<string | null> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.update(id, data));
        patchState(store, { saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        const message = (err as { error?: { message?: string } })?.error?.message;
        return message ?? 'Error al actualizar paciente';
      }
    },

    async create(data: CreatePatientRequest): Promise<string | null> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.create(data));
        patchState(store, { saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        const message = (err as { error?: { message?: string } })?.error?.message;
        return message ?? 'Error al registrar paciente';
      }
    },
  })),
);
