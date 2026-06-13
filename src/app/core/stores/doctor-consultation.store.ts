import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { TriageService } from '@core/services/triage.service';
import { PatientService } from '@core/services/patient.service';
import { MedicalRecordService } from '@core/services/medical-record.service';
import { Cie10Service } from '@core/services/cie10.service';
import { DoctorWorkspaceService } from '@core/services/doctor-workspace.service';
import { ProcessConfigStore } from '@core/stores/process-config.store';
import { AppointmentResponse } from '@core/models/appointment.model';
import { PatientResponse } from '@core/models/patient.model';
import { TriageResponse } from '@core/models/triage.model';
import {
  CreateCertificateRequest,
  CreateMedicalEntryRequest,
  CreateOrderRequest,
  CreatePrescriptionRequest,
  MedicalEntryResponse,
  MedicalRecordResponse,
  MedicalOrderType,
} from '@core/models/medical-record.model';
import { Cie10Code } from '@core/models/cie10.model';
import { NoteTemplateResponse } from '@core/models/doctor-workspace.model';

export interface NoteFields {
  chiefComplaint: string;
  presentIllness: string;
  physicalExamination: string;
  assessment: string;
  plan: string;
  treatment: string;
  notes: string;
  followUpAt: string | null;
}

export interface DraftDiagnosis {
  cie10Id: number | null;
  cie10Code: string | null;
  description: string;
  diagnosisRank: 'PRIMARY' | 'SECONDARY';
}

interface ConsultationState {
  appointmentId: number | null;
  appointment: AppointmentResponse | null;
  patient: PatientResponse | null;
  record: MedicalRecordResponse | null;
  triage: TriageResponse | null;
  diagnoses: DraftDiagnosis[];
  prescriptions: CreatePrescriptionRequest[];
  orders: CreateOrderRequest[];
  certificates: CreateCertificateRequest[];
  templates: NoteTemplateResponse[];
  cie10Results: Cie10Code[];
  cie10Searching: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ConsultationState = {
  appointmentId: null,
  appointment: null,
  patient: null,
  record: null,
  triage: null,
  diagnoses: [],
  prescriptions: [],
  orders: [],
  certificates: [],
  templates: [],
  cie10Results: [],
  cie10Searching: false,
  loading: false,
  saving: false,
  error: null,
};

function ageFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age--;
  return age;
}

export const DoctorConsultationStore = signalStore(
  { providedIn: 'root' },
  withState<ConsultationState>(initialState),
  withComputed((store) => ({
    patientAge: computed(() => ageFromBirthDate(store.patient()?.birthDate)),
    pastEntries: computed((): MedicalEntryResponse[] => {
      const entries = store.record()?.entries ?? [];
      return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }),
    hasTriage: computed(() => store.triage() !== null),
    canFinalize: computed(() => store.appointment() !== null && !store.saving()),
    diagnosisSummary: computed(() =>
      store
        .diagnoses()
        .map((d) => (d.cie10Code ? `${d.cie10Code} · ${d.description}` : d.description))
        .join(' / '),
    ),
  })),
  withMethods((
    store,
    apptSvc = inject(AppointmentService),
    triageSvc = inject(TriageService),
    patientSvc = inject(PatientService),
    recordSvc = inject(MedicalRecordService),
    cie10Svc = inject(Cie10Service),
    workspaceSvc = inject(DoctorWorkspaceService),
    processConfig = inject(ProcessConfigStore),
  ) => ({
    async load(appointmentId: number): Promise<void> {
      patchState(store, { ...initialState, appointmentId, loading: true });
      try {
        const apptRes = await firstValueFrom(apptSvc.getById(appointmentId));
        const appointment = apptRes.data;
        const [patientRes, recordRes] = await Promise.all([
          firstValueFrom(patientSvc.getById(appointment.patientId)),
          firstValueFrom(recordSvc.getByPatient(appointment.patientId)),
        ]);
        let triage: TriageResponse | null = null;
        try {
          const triageRes = await firstValueFrom(
            triageSvc.getLatestByAppointment(appointmentId),
          );
          triage = triageRes.data;
        } catch {
          triage = null;
        }
        patchState(store, {
          appointment,
          patient: patientRes.data,
          record: recordRes.data,
          triage,
          loading: false,
        });
        void this.loadTemplates();
      } catch {
        patchState(store, { loading: false, error: 'No se pudo cargar la consulta' });
      }
    },

    async loadTemplates(): Promise<void> {
      try {
        const res = await firstValueFrom(workspaceSvc.getTemplates());
        patchState(store, { templates: res.data });
      } catch {
        patchState(store, { templates: [] });
      }
    },

    async searchCie10(term: string): Promise<void> {
      const q = term.trim();
      if (q.length < 2) {
        patchState(store, { cie10Results: [], cie10Searching: false });
        return;
      }
      patchState(store, { cie10Searching: true });
      try {
        const res = await firstValueFrom(cie10Svc.search({ q, size: 8 }));
        patchState(store, { cie10Results: res.data.content, cie10Searching: false });
      } catch {
        patchState(store, { cie10Results: [], cie10Searching: false });
      }
    },

    clearCie10(): void {
      patchState(store, { cie10Results: [] });
    },

    addDiagnosis(diagnosis: DraftDiagnosis): void {
      if (store.diagnoses().some((d) => d.description === diagnosis.description)) return;
      patchState(store, { diagnoses: [...store.diagnoses(), diagnosis], cie10Results: [] });
    },

    removeDiagnosis(index: number): void {
      patchState(store, { diagnoses: store.diagnoses().filter((_, i) => i !== index) });
    },

    addPrescription(item: CreatePrescriptionRequest): void {
      patchState(store, { prescriptions: [...store.prescriptions(), item] });
    },

    removePrescription(index: number): void {
      patchState(store, { prescriptions: store.prescriptions().filter((_, i) => i !== index) });
    },

    addOrder(orderType: MedicalOrderType, description: string): void {
      patchState(store, { orders: [...store.orders(), { orderType, description }] });
    },

    removeOrder(index: number): void {
      patchState(store, { orders: store.orders().filter((_, i) => i !== index) });
    },

    addCertificate(item: CreateCertificateRequest): void {
      patchState(store, { certificates: [...store.certificates(), item] });
    },

    removeCertificate(index: number): void {
      patchState(store, { certificates: store.certificates().filter((_, i) => i !== index) });
    },

    async finalize(note: NoteFields): Promise<boolean> {
      const appointmentId = store.appointmentId();
      if (appointmentId === null) return false;
      patchState(store, { saving: true, error: null });
      const body: CreateMedicalEntryRequest = {
        appointmentId,
        entryType: 'CONSULTATION',
        chiefComplaint: note.chiefComplaint || undefined,
        presentIllness: note.presentIllness || undefined,
        physicalExamination: note.physicalExamination || undefined,
        assessment: note.assessment || undefined,
        plan: note.plan || undefined,
        treatment: note.treatment || undefined,
        notes: note.notes || undefined,
        followUpAt: note.followUpAt ?? undefined,
        diagnosis: store.diagnosisSummary() || undefined,
        diagnoses: store.diagnoses().map((d) => ({
          cie10Id: d.cie10Id,
          description: d.description,
          diagnosisRank: d.diagnosisRank,
        })),
        prescriptions: store.prescriptions(),
        orders: store.orders(),
        certificates: store.certificates(),
      };
      try {
        await firstValueFrom(recordSvc.createEntry(body));
        const nextFlow = processConfig.paymentEnabled() ? 'PENDING_PAYMENT' : 'COMPLETED';
        await firstValueFrom(
          apptSvc.updateFlowStatus(appointmentId, { flowStatus: nextFlow }),
        );
        patchState(store, { saving: false });
        return true;
      } catch {
        patchState(store, { saving: false, error: 'No se pudo finalizar la consulta' });
        return false;
      }
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),
);
