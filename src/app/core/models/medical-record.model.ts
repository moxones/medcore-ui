import { ApiResponse } from './api-response.model';

export interface PrescriptionResponse {
  id: number;
  medication: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface MedicalEntryResponse {
  id: number;
  appointmentId: number;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: number;
  createdByName: string;
  prescriptions: PrescriptionResponse[];
}

export interface MedicalRecordResponse {
  recordId: number | null;
  patientId: number;
  patientName: string;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  clinicalNotes: string | null;
  createdAt: string | null;
  entries: MedicalEntryResponse[];
}

export interface CreatePrescriptionRequest {
  medication: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface CreateMedicalEntryRequest {
  appointmentId: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  prescriptions?: CreatePrescriptionRequest[];
}

export interface UpdateClinicalRequest {
  bloodType?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  clinicalNotes?: string | null;
}

export type MedicalRecordApiResponse = ApiResponse<MedicalRecordResponse>;
export type MedicalEntryApiResponse = ApiResponse<MedicalEntryResponse>;
export type MedicalEntryListApiResponse = ApiResponse<MedicalEntryResponse[]>;
