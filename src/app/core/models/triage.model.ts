import { ApiResponse } from './api-response.model';

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'CRITICAL';

export type TriagePrioritySystem = 'ESI' | 'MANCHESTER';

export interface CreateTriageRequest {
  appointmentId: number;
  weight?: number | null;
  height?: number | null;
  temperature?: number | null;
  heartRate?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  bloodPressure?: string | null;
  systolicPressure?: number | null;
  diastolicPressure?: number | null;
  painScale?: number | null;
  bloodGlucose?: number | null;
  bmi?: number | null;
  priorityLevel?: string | null;
  prioritySystem?: TriagePrioritySystem | null;
  notes?: string | null;
  measuredAt?: string | null;
}

export interface TriageResponse {
  id: number;
  appointmentId: number;
  weight: number | null;
  height: number | null;
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  bloodPressure: string | null;
  systolicPressure: number | null;
  diastolicPressure: number | null;
  painScale: number | null;
  bloodGlucose: number | null;
  bmi: number | null;
  priorityLevel: string | null;
  prioritySystem: TriagePrioritySystem | null;
  notes: string | null;
  measuredAt: string | null;
  createdAt: string;
  createdBy: number | null;
}

export interface TriageSummaryResponse {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  doctorId: number;
  doctorName: string;
  appointmentTypeName: string | null;
  scheduledAt: string;
  createdAt: string;
  urgencyLevel: UrgencyLevel;
  weight: number;
  height: number;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  oxygenSaturation: number;
  respiratoryRate: number;
  painScale: number;
  notes: string | null;
  assistantName: string | null;
}

export interface TriageListParams {
  branchId?: number;
  doctorId?: number;
  date?: string;
  urgency?: UrgencyLevel;
}

export type TriageApiResponse = ApiResponse<TriageResponse>;
export type TriageListApiResponse = ApiResponse<TriageResponse[]>;
export type TriageSummaryListApiResponse = ApiResponse<TriageSummaryResponse[]>;
