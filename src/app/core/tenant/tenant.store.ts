import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { TenantService } from './tenant.service';
import { TenantInfoResponse } from '../models/tenant.model';
import { firstValueFrom } from 'rxjs';

const STORAGE_KEY = 'tenant_info';

const DEFAULT_TENANT: TenantInfoResponse = {
  name: 'MedCore',
  logoUrl: null,
  primaryColor: '#0e7490',
  subtitle: 'Sistema de gestión clínica',
};

function restoreFromSession(): { tenant: TenantInfoResponse; loaded: boolean } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { tenant: JSON.parse(raw) as TenantInfoResponse, loaded: true };
  } catch {}
  return { tenant: DEFAULT_TENANT, loaded: false };
}

interface TenantState {
  tenant: TenantInfoResponse;
  loaded: boolean;
}

export const TenantStore = signalStore(
  { providedIn: 'root' },
  withState<TenantState>(restoreFromSession()),
  withMethods((store, service = inject(TenantService)) => ({
    async load(): Promise<void> {
      if (store.loaded()) return;
      const raw = await firstValueFrom(service.resolve());
      const tenant: TenantInfoResponse = {
        name: raw.name ?? DEFAULT_TENANT.name,
        logoUrl: raw.logoUrl ?? null,
        primaryColor: raw.primaryColor ?? DEFAULT_TENANT.primaryColor,
        subtitle: raw.subtitle ?? DEFAULT_TENANT.subtitle,
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tenant));
      } catch {}
      patchState(store, { tenant, loaded: true });
    },
  })),
);
