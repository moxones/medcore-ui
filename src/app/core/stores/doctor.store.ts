import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DoctorService } from '../services/doctor.service';
import { DoctorCardResponse, CreateDoctorRequest } from '../models/doctor.model';
import { PagedResponse, PageRequest } from '../models/pagination.model';

interface DoctorState {
  page: PagedResponse<DoctorCardResponse> | null;
  pagination: PageRequest;
  loading: boolean;
  saving: boolean;
}

export const DoctorStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorState>({
    page: null,
    pagination: { page: 0, size: 20 },
    loading: false,
    saving: false,
  }),
  withMethods((store, service = inject(DoctorService)) => ({
    async load(pagination?: PageRequest): Promise<void> {
      const merged = { ...store.pagination(), ...pagination };
      patchState(store, { loading: true, pagination: merged });
      try {
        const res = await firstValueFrom(service.getCardList(merged));
        patchState(store, { page: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async create(body: CreateDoctorRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.create(body));
        const res = await firstValueFrom(service.getCardList(store.pagination()));
        patchState(store, { page: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async updateLicense(id: number, licenseNumber: string): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.updateLicense(id, licenseNumber));
        const res = await firstValueFrom(service.getCardList(store.pagination()));
        patchState(store, { page: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async deactivate(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.deactivate(id));
        const res = await firstValueFrom(service.getCardList(store.pagination()));
        patchState(store, { page: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },
  })),
);
