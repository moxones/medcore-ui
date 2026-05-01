import { ApiResponse } from './api-response.model';

export interface CreateMedicalRecordRequest {
  patientId: number;
}

export interface MedicalRecordResponse {
  id: number;
  patientId: number;
}

export type MedicalRecordApiResponse = ApiResponse<MedicalRecordResponse>;
