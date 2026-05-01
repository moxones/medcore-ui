import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BranchService } from '../services/branch.service';
import { BranchResponse, CreateBranchRequest } from '../models/branch.model';
import { PagedResponse, PageRequest } from '../models/pagination.model';

interface BranchState {
  page: PagedResponse<BranchResponse> | null;
  pagination: PageRequest;
  loading: boolean;
  saving: boolean;
}

export const BranchStore = signalStore(
  { providedIn: 'root' },
  withState<BranchState>({
    page: null,
    pagination: { page: 0, size: 15 },
    loading: false,
    saving: false,
  }),
  withMethods((store, service = inject(BranchService)) => ({
    async load(pagination?: PageRequest): Promise<void> {
      const merged = { ...store.pagination(), ...pagination };
      patchState(store, { loading: true, pagination: merged });
      try {
        const res = await firstValueFrom(service.getList(merged));
        patchState(store, { page: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async create(body: CreateBranchRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.create(body));
        const res = await firstValueFrom(service.getList(store.pagination()));
        patchState(store, { page: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },
  })),
);
