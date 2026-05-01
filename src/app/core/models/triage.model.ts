import { ApiResponse } from './api-response.model';

export interface CreateTriageRequest {
  appointmentId: number;
  weight: number;
  height: number;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  notes?: string;
}

export interface TriageResponse {
  id: number;
  appointmentId: number;
  weight: number;
  height: number;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  notes: string | null;
}

export type TriageApiResponse = ApiResponse<TriageResponse>;
