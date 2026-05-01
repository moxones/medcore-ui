import { ApiResponse } from './api-response.model';
import { PagedResponse, PageRequest } from './pagination.model';

export interface CreateBranchRequest {
  name: string;
  appointmentDurationMinutes: number;
}

export interface BranchResponse {
  id: number;
  name: string;
  appointmentDurationMinutes: number;
}

export type BranchApiResponse = ApiResponse<BranchResponse>;
export type BranchListApiResponse = ApiResponse<PagedResponse<BranchResponse>>;

export type { PageRequest };
