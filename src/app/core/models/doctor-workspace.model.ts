import { ApiResponse } from './api-response.model';
import { PagedResponse } from './pagination.model';
import {
  MedicalOrderResponse,
  MedicalOrderStatus,
  PrescriptionResponse,
} from './medical-record.model';

export interface DoctorPatientResponse {
  patientId: number;
  fullName: string;
  initials: string;
  gender: string | null;
  birthDate: string | null;
  age: number | null;
  phone: string | null;
  email: string | null;
  bloodType: string | null;
  allergyCount: number;
  conditionCount: number;
  totalVisits: number;
  lastVisitAt: string | null;
  lastReason: string | null;
  nextAppointmentAt: string | null;
}

export interface DoctorPatientsParams {
  q?: string;
  page?: number;
  size?: number;
}

export interface PrescriptionDocumentResponse {
  entryId: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientInitials: string;
  issuedAt: string;
  diagnosisSummary: string | null;
  isLocked: boolean;
  items: PrescriptionResponse[];
}

export interface DoctorPrescriptionsParams {
  q?: string;
  page?: number;
  size?: number;
}

export interface DoctorOrderResponse extends MedicalOrderResponse {
  entryId: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientInitials: string;
}

export interface DoctorOrdersParams {
  status?: MedicalOrderStatus;
}

export interface NoteTemplateResponse {
  id: number;
  name: string;
  specialtyName: string | null;
  chiefComplaint: string | null;
  presentIllness: string | null;
  physicalExamination: string | null;
  assessment: string | null;
  plan: string | null;
  treatment: string | null;
  notes: string | null;
  usageCount: number;
  updatedAt: string;
}

export interface SaveNoteTemplateRequest {
  name: string;
  chiefComplaint?: string | null;
  presentIllness?: string | null;
  physicalExamination?: string | null;
  assessment?: string | null;
  plan?: string | null;
  treatment?: string | null;
  notes?: string | null;
}

export interface DoctorProfileResponse {
  doctorId: number;
  personId: number;
  fullName: string;
  initials: string;
  email: string | null;
  phone: string | null;
  documentNumber: string | null;
  licenseNumber: string;
  isActive: boolean;
  seniorityYears: number;
  joinedAt: string | null;
  specialties: string[];
  branches: string[];
  totalPatients: number;
  appointmentsThisMonth: number;
  consultationsCompleted: number;
  avgConsultationMinutes: number;
}

export type DoctorPatientPageApiResponse = ApiResponse<PagedResponse<DoctorPatientResponse>>;
export type PrescriptionDocumentPageApiResponse = ApiResponse<
  PagedResponse<PrescriptionDocumentResponse>
>;
export type DoctorOrderListApiResponse = ApiResponse<DoctorOrderResponse[]>;
export type NoteTemplateListApiResponse = ApiResponse<NoteTemplateResponse[]>;
export type NoteTemplateApiResponse = ApiResponse<NoteTemplateResponse>;
export type DoctorProfileApiResponse = ApiResponse<DoctorProfileResponse>;
