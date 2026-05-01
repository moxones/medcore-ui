import { ApiResponse } from './api-response.model';
import { PagedResponse, PageRequest } from './pagination.model';

export interface CreateDoctorRequest {
  person: { id: number };
  licenseNumber: string;
}

export interface DoctorResponse {
  id: number;
  licenseNumber: string;
  person: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export type DoctorApiResponse = ApiResponse<DoctorResponse>;
export type DoctorListApiResponse = ApiResponse<PagedResponse<DoctorResponse>>;

export type { PageRequest };
