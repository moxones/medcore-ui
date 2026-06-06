import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { MedicalRecordService } from '@core/services/medical-record.service';
import { MedicalEntryResponse, MedicalRecordResponse } from '@core/models/medical-record.model';

interface DoctorMedicalRecordsState {
  selectedPatientId: number | null;
  record: MedicalRecordResponse | null;
  expandedEntryId: number | null;
  loading: boolean;
  error: string | null;
}

export const DoctorMedicalRecordsStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorMedicalRecordsState>({
    selectedPatientId: null,
    record: null,
    expandedEntryId: null,
    loading: false,
    error: null,
  }),
  withComputed((store) => ({
    entries: computed((): MedicalEntryResponse[] => {
      const list = store.record()?.entries ?? [];
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }),
    hasSelection: computed(() => store.selectedPatientId() !== null),
    entryCount: computed(() => store.record()?.entries.length ?? 0),
  })),
  withMethods((store, recordSvc = inject(MedicalRecordService)) => ({
    async selectPatient(patientId: number): Promise<void> {
      patchState(store, { selectedPatientId: patientId, loading: true, error: null, record: null });
      try {
        const res = await firstValueFrom(recordSvc.getByPatient(patientId));
        const record = res.data;
        patchState(store, {
          record,
          loading: false,
          expandedEntryId: record.entries[0]?.id ?? null,
        });
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar el historial del paciente' });
      }
    },

    toggleEntry(entryId: number): void {
      patchState(store, {
        expandedEntryId: store.expandedEntryId() === entryId ? null : entryId,
      });
    },

    clear(): void {
      patchState(store, { selectedPatientId: null, record: null, expandedEntryId: null });
    },
  })),
);
