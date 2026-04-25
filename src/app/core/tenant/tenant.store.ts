import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { TenantService } from './tenant.service';
import { TenantInfoResponse } from '../models/tenant.model';
import { firstValueFrom } from 'rxjs';

const DEFAULT_TENANT: TenantInfoResponse = {
  name: 'MedCore',
  logoUrl: null,
  primaryColor: '#0e7490',
  subtitle: 'Sistema de gestión clínica',
};

interface TenantState {
  tenant: TenantInfoResponse;
  loaded: boolean;
}

const initialState: TenantState = {
  tenant: DEFAULT_TENANT,
  loaded: false,
};

export const TenantStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(TenantService)) => ({
    async load(): Promise<void> {
      const raw = await firstValueFrom(service.resolve());
      const tenant: TenantInfoResponse = {
        name: raw.name ?? DEFAULT_TENANT.name,
        logoUrl: raw.logoUrl ?? null,
        primaryColor: raw.primaryColor ?? DEFAULT_TENANT.primaryColor,
        subtitle: raw.subtitle ?? DEFAULT_TENANT.subtitle,
      };
      patchState(store, { tenant, loaded: true });
    },
  })),
);
