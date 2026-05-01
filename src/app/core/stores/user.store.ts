import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../services/user.service';
import {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '../models/user.model';

interface UserState {
  users: UserResponse[];
  loading: boolean;
  saving: boolean;
}

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState<UserState>({
    users: [],
    loading: false,
    saving: false,
  }),
  withMethods((store, service = inject(UserService)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getList());
        patchState(store, { users: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async create(body: CreateUserRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.create(body));
        const res = await firstValueFrom(service.getList());
        patchState(store, { users: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async update(id: number, body: UpdateUserRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.update(id, body));
        const res = await firstValueFrom(service.getList());
        patchState(store, { users: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async toggleStatus(id: number, isActive: boolean): Promise<void> {
      try {
        await firstValueFrom(service.updateStatus(id, { isActive }));
        const res = await firstValueFrom(service.getList());
        patchState(store, { users: res.data });
      } catch {
      }
    },
  })),
);
