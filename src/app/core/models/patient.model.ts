import { ApiResponse } from './api-response.model';
import { PagedResponse } from './pagination.model';

export interface PatientRegisterRequest {
  email: string;
  password: string;
  documentTypeCode: string;
  documentNumber: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface PatientRegisterResult {
  id: number;
  firstName: string;
  lastName: string;
  contactEmail: string;
}

export interface EmailAvailabilityResult {
  available: boolean;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  documentTypeCode: string;
  documentNumber: string;
  birthDate?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  contactEmail?: string | null;
}

export interface PatientResponse {
  id: number;
  patientId: number;
  firstName: string;
  lastName: string;
  contactEmail: string | null;
  phone?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  profileCompleted?: boolean;
  hasAccount: boolean;
  userEmail: string | null;
  accountActive: boolean | null;
}

export interface UpdatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  gender?: string | null;
}

export interface PatientProfileResponse {
  id: number;
  patientId: number;
  firstName: string;
  lastName: string;
  contactEmail: string | null;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  profileCompleted: boolean;
  hasAccount: boolean;
  accountActive: boolean;
}

export interface PatientSearchParams {
  query?: string;
  page?: number;
  size?: number;
}

export type PatientApiResponse = ApiResponse<PatientResponse>;
export type PatientListApiResponse = ApiResponse<PagedResponse<PatientResponse>>;
export type PatientSearchApiResponse = ApiResponse<PatientResponse[]>;
