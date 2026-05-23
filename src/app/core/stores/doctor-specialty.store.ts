import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DoctorService } from '../services/doctor.service';
import { DoctorSpecialty } from '../models/catalog.model';

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

interface DoctorSpecialtyState {
  doctorId: number | null;
  assigned: DoctorSpecialty[];
  available: DoctorSpecialty[];
  loading: boolean;
  busyItemId: number | null;
  error: string | null;
}

export const DoctorSpecialtyStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorSpecialtyState>({
    doctorId: null,
    assigned: [],
    available: [],
    loading: false,
    busyItemId: null,
    error: null,
  }),
  withMethods((store, service = inject(DoctorService)) => {
    async function refresh(doctorId: number): Promise<void> {
      const [assigned, available] = await Promise.all([
        firstValueFrom(service.getSpecialties(doctorId)),
        firstValueFrom(service.getAvailableSpecialties(doctorId)),
      ]);
      patchState(store, { assigned: assigned.data, available: available.data });
    }

    return {
      clearError(): void {
        patchState(store, { error: null });
      },

      async load(doctorId: number): Promise<void> {
        patchState(store, { doctorId, loading: true, error: null, assigned: [], available: [] });
        try {
          await refresh(doctorId);
        } catch (err: unknown) {
          patchState(store, { error: extractErrorMessage(err) });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async assign(specialtyId: number): Promise<string | null> {
        const doctorId = store.doctorId();
        if (doctorId === null) return null;
        patchState(store, { busyItemId: specialtyId, error: null });
        try {
          await firstValueFrom(service.assignSpecialty(doctorId, specialtyId));
          await refresh(doctorId);
          patchState(store, { busyItemId: null });
          return null;
        } catch (err: unknown) {
          const message = extractErrorMessage(err);
          patchState(store, { busyItemId: null, error: message });
          return message;
        }
      },

      async remove(specialtyId: number): Promise<string | null> {
        const doctorId = store.doctorId();
        if (doctorId === null) return null;
        patchState(store, { busyItemId: specialtyId, error: null });
        try {
          await firstValueFrom(service.removeSpecialty(doctorId, specialtyId));
          await refresh(doctorId);
          patchState(store, { busyItemId: null });
          return null;
        } catch (err: unknown) {
          const message = extractErrorMessage(err);
          patchState(store, { busyItemId: null, error: message });
          return message;
        }
      },
    };
  }),
);
