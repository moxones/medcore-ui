import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { MedicalRecordService } from '@core/services/medical-record.service';
import { TriageService } from '@core/services/triage.service';
import { MedicalRecordResponse } from '@core/models/medical-record.model';
import { PatientResponse } from '@core/models/patient.model';
import { TriageSummaryResponse } from '@core/models/triage.model';

interface PatientDossierState {
  patient: PatientResponse | null;
  record: MedicalRecordResponse | null;
  triages: TriageSummaryResponse[];
  loading: boolean;
  error: string | null;
}

export const PatientDossierStore = signalStore(
  { providedIn: 'root' },
  withState<PatientDossierState>({
    patient: null,
    record: null,
    triages: [],
    loading: false,
    error: null,
  }),
  withMethods((
    store,
    recordSvc = inject(MedicalRecordService),
    triageSvc = inject(TriageService),
  ) => ({
    async open(patient: PatientResponse): Promise<void> {
      patchState(store, { patient, record: null, triages: [], loading: true, error: null });
      const patientId = patient.id;
      const [recordRes, triagesRes] = await Promise.allSettled([
        firstValueFrom(recordSvc.getByPatient(patientId)),
        firstValueFrom(triageSvc.getByPatient(patientId)),
      ]);
      patchState(store, {
        record: recordRes.status === 'fulfilled' ? recordRes.value.data : null,
        triages: triagesRes.status === 'fulfilled' ? triagesRes.value.data : [],
        error: recordRes.status === 'rejected' ? 'No se pudo cargar la ficha clínica' : null,
        loading: false,
      });
    },

    close(): void {
      patchState(store, { patient: null, record: null, triages: [], error: null });
    },
  })),
);
