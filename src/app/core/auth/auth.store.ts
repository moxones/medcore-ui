import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from './auth.service';
import { firstValueFrom } from 'rxjs';
import { Role, ROLE_REDIRECTS, normalizeRole } from '@core/models/role.model';
import { UserMeResponse } from '@core/models/auth.model';

interface AuthState {
  accessToken: string | null;
  roles: Role[];
  user: UserMeResponse | null;
  loading: boolean;
  error: string | null;
}

function getInitialAuthState(): AuthState {
  const isBrowser = typeof localStorage !== 'undefined';
  return {
    accessToken: isBrowser ? localStorage.getItem('access_token') : null,
    roles: isBrowser ? JSON.parse(localStorage.getItem('roles') ?? '[]') : [],
    user: isBrowser ? JSON.parse(localStorage.getItem('user') ?? 'null') : null,
    loading: false,
    error: null,
  };
}

const initialState: AuthState = getInitialAuthState();

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ accessToken, roles, user }) => ({
    isAuthenticated: computed(() => !!accessToken()),
    isSuperAdmin: computed(() => roles().includes('SUPERADMIN')),
    isAdmin: computed(() => roles().includes('ADMIN') || roles().includes('SUPERADMIN')),
    isReceptionist: computed(() => roles().includes('USER')),
    isPatient: computed(() => roles().includes('PATIENT')),
    fullName: computed(() => (user() ? `${user()!.firstName} ${user()!.lastName}` : '')),
    tenantId: computed(() => user()?.tenantId ?? null),
  })),
  withMethods((store, auth = inject(AuthService), router = inject(Router)) => ({
    async login(credentials: LoginRequest): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await firstValueFrom(auth.login(credentials));

        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);

        const me = await firstValueFrom(auth.me());

        const roles = me.roles.map(normalizeRole).filter((r): r is Role => r !== null);
        localStorage.setItem('roles', JSON.stringify(roles));
        localStorage.setItem('user', JSON.stringify(me));

        patchState(store, {
          accessToken: res.accessToken,
          roles,
          user: me,
          loading: false,
        });

        const priority: Role[] = ['SUPERADMIN', 'ADMIN', 'USER', 'PATIENT'];
        const primaryRole = priority.find((r) => roles.includes(r)) ?? 'PATIENT';
        router.navigate([ROLE_REDIRECTS[primaryRole]]);
      } catch (err: any) {
        patchState(store, {
          loading: false,
          error: err?.error?.message ?? 'Credenciales incorrectas',
        });
      }
    },

    async logout(): Promise<void> {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          await firstValueFrom(auth.logout(refreshToken));
        } catch {}
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('roles');
        localStorage.removeItem('user'); 
      }
      patchState(store, { accessToken: null, roles: [], user: null });
      router.navigate(['/login']);
    },
  })),
);
