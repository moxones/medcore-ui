import { ApiResponse } from './api-response.model';
import { PagedResponse } from './pagination.model';

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  documentTypeCode: string;
  documentNumber: string;
}

export interface UpdateProfileRequest {
  phone: string;
  gender: string;
  birthDate: string;
  contactEmail: string;
}

export interface PatientResponse {
  id: number;
  firstName: string;
  lastName: string;
  contactEmail: string | null;
}

export interface PatientSearchParams {
  query?: string;
  page?: number;
  size?: number;
}

export type PatientApiResponse = ApiResponse<PatientResponse>;
export type PatientListApiResponse = ApiResponse<PagedResponse<PatientResponse>>;
