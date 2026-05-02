import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { AuthStore } from '../auth/auth.store';
import {
  UserResponse,
  CreateUserRequest,
  CreateSuperAdminUserRequest,
  UpdateUserRequest,
} from '../models/user.model';

function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se puede conectar al servidor. Verifica tu conexión e intenta de nuevo.';
    }
    const msg = err.error?.message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

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
  withMethods((store, service = inject(UserService), authStore = inject(AuthStore)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const isSuperAdmin = authStore.isSuperAdmin();
        const res = await firstValueFrom(
          isSuperAdmin ? service.getListForSuperAdmin() : service.getList()
        );
        patchState(store, { users: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async create(body: CreateUserRequest): Promise<string | null> {
      patchState(store, { saving: true });
      try {
        const created = await firstValueFrom(service.create(body));
        if (!created.data?.roles?.length) {
          patchState(store, { saving: false });
          return 'El usuario fue creado pero no se pudo asignar el rol correctamente.';
        }
        const isSuperAdmin = authStore.isSuperAdmin();
        const res = await firstValueFrom(
          isSuperAdmin ? service.getListForSuperAdmin() : service.getList()
        );
        patchState(store, { users: res.data, saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        return extractErrorMessage(err);
      }
    },

    async createForTenant(body: CreateSuperAdminUserRequest): Promise<string | null> {
      patchState(store, { saving: true });
      try {
        const created = await firstValueFrom(service.createForTenant(body));
        if (!created.data?.roles?.length) {
          patchState(store, { saving: false });
          return 'El usuario fue creado pero no se pudo asignar el rol correctamente.';
        }
        const isSuperAdmin = authStore.isSuperAdmin();
        const res = await firstValueFrom(
          isSuperAdmin ? service.getListForSuperAdmin() : service.getList()
        );
        patchState(store, { users: res.data, saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        return extractErrorMessage(err);
      }
    },

    async update(id: number, body: UpdateUserRequest): Promise<string | null> {
      const target = store.users().find((u) => u.id === id);
      if (!target) {
        return 'El usuario no se encuentra en el estado actual.';
      }
      patchState(store, { saving: true });
      try {
        const isSuperAdmin = authStore.isSuperAdmin();
        const updated = await firstValueFrom(
          isSuperAdmin ? service.updateForSuperAdmin(id, body) : service.update(id, body)
        );
        if (updated.data?.id !== id) {
          patchState(store, { saving: false });
          return 'Error de integridad: el registro retornado no corresponde al usuario editado.';
        }
        const res = await firstValueFrom(
          isSuperAdmin ? service.getListForSuperAdmin() : service.getList()
        );
        patchState(store, { users: res.data, saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        return extractErrorMessage(err);
      }
    },

    async assignRoles(id: number, roleIds: number[]): Promise<string | null> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.assignRoles(id, { roleIds }));
        const isSuperAdmin = authStore.isSuperAdmin();
        const res = await firstValueFrom(
          isSuperAdmin ? service.getListForSuperAdmin() : service.getList()
        );
        patchState(store, { users: res.data, saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        return extractErrorMessage(err);
      }
    },

    async toggleStatus(id: number, isActive: boolean): Promise<void> {
      try {
        await firstValueFrom(service.updateStatus(id, { isActive }));
        const isSuperAdmin = authStore.isSuperAdmin();
        const res = await firstValueFrom(
          isSuperAdmin ? service.getListForSuperAdmin() : service.getList()
        );
        patchState(store, { users: res.data });
      } catch {
      }
    },

    async delete(id: number): Promise<string | null> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.delete(id));
        const isSuperAdmin = authStore.isSuperAdmin();
        const res = await firstValueFrom(
          isSuperAdmin ? service.getListForSuperAdmin() : service.getList()
        );
        patchState(store, { users: res.data, saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        return extractErrorMessage(err);
      }
    },

    async setUserPassword(id: number, newPassword: string): Promise<string | null> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.setUserPassword(id, { newPassword }));
        patchState(store, { saving: false });
        return null;
      } catch (err: unknown) {
        patchState(store, { saving: false });
        return extractErrorMessage(err);
      }
    },
  })),
);
