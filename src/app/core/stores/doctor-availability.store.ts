import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DoctorService } from '@core/services/doctor.service';
import {
  CreateDoctorScheduleRequest,
  DoctorBranchResponse,
  DoctorScheduleResponse,
} from '@core/models/doctor.model';

interface DoctorAvailabilityState {
  doctorId: number | null;
  branches: DoctorBranchResponse[];
  schedules: DoctorScheduleResponse[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const DoctorAvailabilityStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorAvailabilityState>({
    doctorId: null,
    branches: [],
    schedules: [],
    loading: false,
    saving: false,
    error: null,
  }),
  withComputed((store) => ({
    activeSchedules: computed(() => store.schedules().filter((s) => s.isActive)),
    schedulesByDay: computed(() => {
      const map = new Map<number, DoctorScheduleResponse[]>();
      for (const s of store.schedules().filter((sc) => sc.isActive)) {
        const bucket = map.get(s.dayOfWeek) ?? [];
        bucket.push(s);
        map.set(s.dayOfWeek, bucket);
      }
      for (const bucket of map.values()) {
        bucket.sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
      return map;
    }),
    weeklyHours: computed(() => {
      let minutes = 0;
      for (const s of store.schedules().filter((sc) => sc.isActive)) {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        minutes += eh * 60 + em - (sh * 60 + sm);
      }
      return Math.round((minutes / 60) * 10) / 10;
    }),
    hasBranches: computed(() => store.branches().length > 0),
  })),
  withMethods((store, doctorSvc = inject(DoctorService)) => {
    async function loadSchedules(): Promise<void> {
      const doctorId = store.doctorId();
      if (doctorId === null) return;
      const res = await firstValueFrom(doctorSvc.getSchedules(doctorId));
      patchState(store, { schedules: res.data });
    }

    return {
      async loadInit(): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          if (store.doctorId() === null) {
            const me = await firstValueFrom(doctorSvc.getMe());
            patchState(store, { doctorId: me.data.id });
          }
          const doctorId = store.doctorId();
          if (doctorId === null) return;
          const branchesRes = await firstValueFrom(doctorSvc.getBranches(doctorId));
          patchState(store, { branches: branchesRes.data.filter((b) => b.isActive) });
          await loadSchedules();
        } catch {
          patchState(store, { error: 'No se pudo cargar tu disponibilidad' });
        } finally {
          patchState(store, { loading: false });
        }
      },

      async addSchedule(body: CreateDoctorScheduleRequest): Promise<boolean> {
        const doctorId = store.doctorId();
        if (doctorId === null) return false;
        patchState(store, { saving: true, error: null });
        try {
          await firstValueFrom(doctorSvc.createSchedule(doctorId, body));
          await loadSchedules();
          patchState(store, { saving: false });
          return true;
        } catch {
          patchState(store, { saving: false, error: 'No se pudo crear el horario' });
          return false;
        }
      },

      async removeSchedule(scheduleId: number): Promise<void> {
        const doctorId = store.doctorId();
        if (doctorId === null) return;
        patchState(store, {
          schedules: store.schedules().filter((s) => s.id !== scheduleId),
        });
        try {
          await firstValueFrom(doctorSvc.deactivateSchedule(doctorId, scheduleId));
        } catch {
          patchState(store, { error: 'No se pudo eliminar el horario' });
          await loadSchedules();
        }
      },
    };
  }),
);
