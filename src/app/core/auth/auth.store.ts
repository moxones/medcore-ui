import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, LoginRequest } from './auth.service';
import { TokenService } from './token.service';
import { firstValueFrom } from 'rxjs';
import { Role, ROLE_REDIRECTS, normalizeRole } from '@core/models/role.model';
import { UserMeResponse } from '@core/models/auth.model';

interface AuthState {
  accessToken: string | null;
  roles: Role[];
  user: UserMeResponse | null;
  loading: boolean;
  loggingOut: boolean;
  error: string | null;
}

function getInitialAuthState(): AuthState {
  const isBrowser = typeof localStorage !== 'undefined';
  return {
    accessToken: isBrowser ? localStorage.getItem('access_token') : null,
    roles: isBrowser ? JSON.parse(localStorage.getItem('roles') ?? '[]') : [],
    user: isBrowser ? JSON.parse(localStorage.getItem('user') ?? 'null') : null,
    loading: false,
    loggingOut: false,
    error: null,
  };
}

function resolveLoginError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se puede conectar al servidor. Verifica tu conexión e intenta de nuevo.';
    }
    return err.error?.message ?? 'Credenciales incorrectas.';
  }
  return 'Error inesperado. Intenta de nuevo.';
}

const initialState: AuthState = getInitialAuthState();

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ accessToken, roles, user }) => ({
    isAuthenticated: computed(() => !!accessToken()),
    isSuperAdmin: computed(() => roles().includes('SUPER_ADMIN')),
    isAdmin: computed(() => roles().includes('CLINIC_ADMIN') || roles().includes('SUPER_ADMIN')),
    isClinicAdmin: computed(() => roles().includes('CLINIC_ADMIN')),
    isDoctor: computed(() => roles().includes('DOCTOR')),
    isAssistant: computed(() => roles().includes('ASSISTANT')),
    isReceptionist: computed(() => roles().includes('RECEPTIONIST')),
    isPatient: computed(() => roles().includes('PATIENT')),
    needsProfileCompletion: computed(
      () => !!user() && !user()!.profileCompleted && roles().includes('PATIENT'),
    ),
    fullName: computed(() => {
      const u = user();
      if (!u) return '';
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      return [u.firstName, u.lastName].filter(Boolean).map(cap).join(' ');
    }),
    tenantId: computed(() => user()?.tenantId ?? null),
    branchIds: computed(() => user()?.branchIds ?? []),
    isReceptionStaff: computed(() => roles().includes('ASSISTANT') || roles().includes('RECEPTIONIST')),
  })),
  withMethods(
    (store, auth = inject(AuthService), router = inject(Router), tokens = inject(TokenService)) => {
      let refreshInFlight: Promise<string | null> | null = null;

      return {
        async login(credentials: LoginRequest): Promise<void> {
          patchState(store, { loading: true, error: null });
          try {
            const res = await firstValueFrom(auth.login(credentials));
            tokens.setTokens(res.accessToken, res.refreshToken);

            const me = await firstValueFrom(auth.me());
            const roles = me.roles.map(normalizeRole).filter((r): r is Role => r !== null);

            const isStaff = roles.includes('ASSISTANT') || roles.includes('RECEPTIONIST');
            if (isStaff && (!me.branchIds || me.branchIds.length === 0)) {
              tokens.clear();
              patchState(store, {
                loading: false,
                error: 'Tu cuenta no tiene sucursales asignadas. Solicita al administrador que te asigne al menos una sucursal para poder acceder.',
              });
              return;
            }

            tokens.setSession(roles, me);

            patchState(store, {
              accessToken: res.accessToken,
              roles,
              user: me,
              loading: false,
            });

            const priority: Role[] = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'PATIENT'];
            const primaryRole = priority.find((r) => roles.includes(r)) ?? 'PATIENT';
            router.navigate([ROLE_REDIRECTS[primaryRole]]);
          } catch (err: unknown) {
            patchState(store, { loading: false, error: resolveLoginError(err) });
          }
        },

        refreshAccessToken(): Promise<string | null> {
          if (refreshInFlight) return refreshInFlight;

          const refreshToken = tokens.getRefreshToken();
          if (!refreshToken) return Promise.resolve(null);

          refreshInFlight = (async () => {
            try {
              const res = await firstValueFrom(auth.refresh({ refreshToken }));
              tokens.setTokens(res.accessToken, res.refreshToken);
              patchState(store, { accessToken: res.accessToken });
              return res.accessToken;
            } catch {
              return null;
            } finally {
              refreshInFlight = null;
            }
          })();

          return refreshInFlight;
        },

        resetSession(): void {
          tokens.clear();
          patchState(store, { accessToken: null, roles: [], user: null });
          router.navigate(['/login']);
        },

        markProfileCompleted(firstName?: string, lastName?: string): void {
          const u = store.user();
          if (!u) return;
          const updated: UserMeResponse = {
            ...u,
            profileCompleted: true,
            firstName: firstName ?? u.firstName,
            lastName: lastName ?? u.lastName,
          };
          patchState(store, { user: updated });
          tokens.setSession(store.roles(), updated);
        },

        async logout(): Promise<void> {
          patchState(store, { loggingOut: true });
          const refreshToken = tokens.getRefreshToken();
          tokens.clear();
          patchState(store, { accessToken: null, roles: [], user: null });

          if (refreshToken) {
            void firstValueFrom(auth.logout(refreshToken)).catch(() => undefined);
          }

          await router.navigate(['/login']);
          patchState(store, { loggingOut: false });
        },
      };
    },
  ),
);
