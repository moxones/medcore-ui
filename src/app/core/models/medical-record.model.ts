import { ApiResponse } from './api-response.model';

export type MedicalEntryType = 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'ADDENDUM';
export type DiagnosisType = 'PRESUMPTIVE' | 'DEFINITIVE' | 'DIFFERENTIAL';
export type DiagnosisRank = 'PRIMARY' | 'SECONDARY';
export type MedicalOrderType = 'LAB' | 'IMAGING' | 'PROCEDURE' | 'REFERRAL' | 'OTHER';
export type MedicalOrderStatus = 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type CertificateType = 'DESCANSO' | 'APTITUD' | 'ASISTENCIA' | 'OTRO';

export interface PrescriptionResponse {
  id: number;
  medication: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  quantity: string | null;
  presentation: string | null;
  isActive: boolean;
  instructions: string | null;
}

export interface MedicalDiagnosisResponse {
  id: number;
  cie10Id: number | null;
  cie10Code: string | null;
  description: string;
  diagnosisType: DiagnosisType;
  diagnosisRank: DiagnosisRank;
  notes: string | null;
}

export interface MedicalProcedureResponse {
  id: number;
  code: string | null;
  name: string;
  notes: string | null;
  performedAt: string | null;
}

export interface MedicalOrderResultResponse {
  id: number;
  result: string | null;
  fileUrl: string | null;
  resultDate: string | null;
}

export interface MedicalOrderResponse {
  id: number;
  orderType: MedicalOrderType;
  description: string;
  status: MedicalOrderStatus;
  requestedAt: string;
  results: MedicalOrderResultResponse[];
}

export interface MedicalCertificateResponse {
  id: number;
  certificateType: CertificateType;
  content: string;
  restDays: number | null;
  issuedAt: string;
  validUntil: string | null;
}

export interface MedicalEntryResponse {
  id: number;
  appointmentId: number;
  entryType: MedicalEntryType;
  chiefComplaint: string | null;
  presentIllness: string | null;
  reviewOfSystems: string | null;
  physicalExamination: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  followUpAt: string | null;
  isLocked: boolean;
  signedBy: number | null;
  signedByName: string | null;
  signedAt: string | null;
  createdAt: string;
  createdBy: number;
  createdByName: string;
  prescriptions: PrescriptionResponse[];
  diagnoses: MedicalDiagnosisResponse[];
  procedures: MedicalProcedureResponse[];
  orders: MedicalOrderResponse[];
  certificates: MedicalCertificateResponse[];
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
  route?: string;
  quantity?: string;
  presentation?: string;
  instructions?: string;
}

export interface CreateDiagnosisRequest {
  cie10Id?: number | null;
  description: string;
  diagnosisType?: DiagnosisType;
  diagnosisRank?: DiagnosisRank;
  notes?: string | null;
}

export interface CreateProcedureRequest {
  code?: string | null;
  name: string;
  notes?: string | null;
  performedAt?: string | null;
}

export interface CreateOrderRequest {
  orderType: MedicalOrderType;
  description: string;
}

export interface CreateCertificateRequest {
  certificateType: CertificateType;
  content: string;
  restDays?: number | null;
  validUntil?: string | null;
}

export interface CreateMedicalEntryRequest {
  appointmentId: number;
  entryType?: MedicalEntryType;
  chiefComplaint?: string;
  presentIllness?: string;
  reviewOfSystems?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUpAt?: string;
  prescriptions?: CreatePrescriptionRequest[];
  diagnoses?: CreateDiagnosisRequest[];
  procedures?: CreateProcedureRequest[];
  orders?: CreateOrderRequest[];
  certificates?: CreateCertificateRequest[];
}

export interface CreateOrderResultRequest {
  result: string;
  fileUrl?: string | null;
  resultDate?: string | null;
  status?: MedicalOrderStatus;
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
export type MedicalOrderApiResponse = ApiResponse<MedicalOrderResponse>;
