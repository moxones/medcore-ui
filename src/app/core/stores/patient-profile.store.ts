import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PatientService } from '@core/services/patient.service';
import { AuthStore } from '@core/auth/auth.store';
import { PatientProfileResponse, UpdateProfileRequest } from '@core/models/patient.model';

interface PatientProfileState {
  profile: PatientProfileResponse | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const PatientProfileStore = signalStore(
  { providedIn: 'root' },
  withState<PatientProfileState>({
    profile: null,
    loading: false,
    saving: false,
    error: null,
  }),
  withMethods((store, service = inject(PatientService), authStore = inject(AuthStore)) => ({
    async loadProfile(): Promise<void> {
      if (store.loading()) return;
      patchState(store, { loading: true, error: null });
      try {
        const res = await firstValueFrom(service.getProfile());
        patchState(store, { profile: res.data, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar el perfil.' });
      }
    },

    async saveProfile(data: UpdateProfileRequest): Promise<string | null> {
      patchState(store, { saving: true, error: null });
      try {
        const res = await firstValueFrom(service.updateProfile(data));
        patchState(store, { profile: res.data, saving: false });
        authStore.markProfileCompleted(data.firstName, data.lastName);
        return null;
      } catch {
        patchState(store, { saving: false, error: 'No se pudo guardar el perfil. Intenta de nuevo.' });
        return 'No se pudo guardar el perfil. Intenta de nuevo.';
      }
    },

    clearError(): void {
      patchState(store, { error: null });
    },
  })),
);
