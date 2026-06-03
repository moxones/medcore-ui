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

export interface BranchDaySchedule {
  branchId: number | null;
  branchName: string;
  scheduleByDay: Record<string, string | null>;
}

export interface DoctorCardResponse {
  id: number;
  personId: number;
  fullName: string;
  initials: string;
  licenseNumber: string;
  isActive: boolean;
  seniorityYears: number;
  specialties: string[];
  branches: string[];
  availableToday: boolean;
  weekScheduleByBranch: Record<string, BranchDaySchedule>;
  appointmentsThisMonth: number;
  appointmentsGrowthPercent: number;
}

export interface DoctorBranchResponse {
  id: number;
  doctorId: number;
  branchId: number;
  branchName: string;
  branchAddress: string;
  isActive: boolean;
  createdAt: string;
  doctorFullName: string | null;
  doctorLicenseNumber: string | null;
}

export interface BulkAssignBranchesRequest {
  branchIds: number[];
}

export interface DoctorScheduleResponse {
  id: number;
  doctorId: number;
  doctorBranchId: number;
  branchId: number;
  branchName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  slotDurationMinutes: number;
  maxPatientsPerSlot: number | null;
  validFrom: string | null;
  validUntil: string | null;
}

export interface DoctorListParams extends PageRequest {
  branchId?: number;
  specialtyId?: number;
  isActive?: boolean;
  availableToday?: boolean;
}

export interface DoctorScheduleListParams {
  branchId?: number;
  dayOfWeek?: number;
  isActive?: boolean;
}

export interface CreateDoctorScheduleRequest {
  doctorBranchId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
  maxPatientsPerSlot?: number;
  validFrom?: string;
  validUntil?: string | null;
  isActive?: boolean;
}

export type UpdateDoctorScheduleRequest = Partial<CreateDoctorScheduleRequest>;

export interface DoctorSelfResponse {
  id: number;
  tenantId: number;
  licenseNumber: string;
  isActive: boolean;
  createdAt: string;
}

export type DoctorApiResponse = ApiResponse<DoctorResponse>;
export type DoctorSelfApiResponse = ApiResponse<DoctorSelfResponse>;
export type DoctorListApiResponse = ApiResponse<PagedResponse<DoctorResponse>>;
export type DoctorCardListApiResponse = ApiResponse<PagedResponse<DoctorCardResponse>>;
export type DoctorBranchApiResponse = ApiResponse<DoctorBranchResponse>;
export type DoctorBranchListApiResponse = ApiResponse<DoctorBranchResponse[]>;
export type DoctorScheduleApiResponse = ApiResponse<DoctorScheduleResponse>;
export type DoctorScheduleListApiResponse = ApiResponse<DoctorScheduleResponse[]>;

export type { PageRequest };

