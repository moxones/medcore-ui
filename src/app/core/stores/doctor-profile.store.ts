import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DoctorWorkspaceService } from '@core/services/doctor-workspace.service';
import { DoctorProfileResponse } from '@core/models/doctor-workspace.model';

interface DoctorProfileState {
  profile: DoctorProfileResponse | null;
  loading: boolean;
  error: string | null;
}

export const DoctorProfileStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorProfileState>({
    profile: null,
    loading: false,
    error: null,
  }),
  withMethods((store, service = inject(DoctorWorkspaceService)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await firstValueFrom(service.getProfile());
        patchState(store, { profile: res.data, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar tu perfil' });
      }
    },
  })),
);
