import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { OrganizationService } from '../services/organization.service';
import { CreateTenantRequest, TenantResponse, UpdateTenantRequest } from '../models/organization.model';

interface OrganizationState {
  items: TenantResponse[];
  loading: boolean;
  saving: boolean;
}

export const OrganizationStore = signalStore(
  { providedIn: 'root' },
  withState<OrganizationState>({
    items: [],
    loading: false,
    saving: false,
  }),
  withMethods((store, service = inject(OrganizationService)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getList());
        patchState(store, { items: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async create(body: CreateTenantRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.create(body));
        const res = await firstValueFrom(service.getList());
        patchState(store, { items: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async update(id: number, body: UpdateTenantRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.update(id, body));
        const res = await firstValueFrom(service.getList());
        patchState(store, { items: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async remove(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.delete(id));
        patchState(store, {
          items: store.items().filter((t) => t.id !== id),
          saving: false,
        });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },
  })),
);
