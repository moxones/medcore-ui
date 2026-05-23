import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { AppointmentFlowStatus, AppointmentResponse } from '@core/models/appointment.model';
import { PagedResponse } from '@core/models/pagination.model';

interface PatientAppointmentsState {
  page: PagedResponse<AppointmentResponse> | null;
  activeFilter: AppointmentFlowStatus | '';
  loading: boolean;
  cancelling: number | null;
}

export const PatientAppointmentsStore = signalStore(
  { providedIn: 'root' },
  withState<PatientAppointmentsState>({
    page: null,
    activeFilter: '',
    loading: false,
    cancelling: null,
  }),
  withComputed(({ page }) => ({
    appointments: computed(() => page()?.content ?? []),
    totalElements: computed(() => page()?.totalElements ?? 0),
    pageSize: computed(() => page()?.pageSize ?? 10),
    pageNumber: computed(() => page()?.pageNumber ?? 0),
  })),
  withMethods((store, service = inject(AppointmentService)) => ({
    async load(params: { page?: number; size?: number; statusId?: number } = {}): Promise<void> {
      if (store.loading()) return;
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getList({ size: 10, page: 0, ...params }));
        patchState(store, { page: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async cancel(id: number): Promise<string | null> {
      patchState(store, { cancelling: id });
      try {
        await firstValueFrom(service.cancel(id, { reason: 'Cancelado por el paciente' }));
        patchState(store, { cancelling: null });
        return null;
      } catch {
        patchState(store, { cancelling: null });
        return 'No se pudo cancelar la cita. Intenta de nuevo.';
      }
    },

    setFilter(filter: AppointmentFlowStatus | ''): void {
      patchState(store, { activeFilter: filter });
    },
  })),
);
