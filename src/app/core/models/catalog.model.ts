import { ApiResponse } from './api-response.model';

export type CatalogKind = 'specialties' | 'appointmentTypes' | 'documentTypes';

export type MasterKind =
  | 'specialties'
  | 'appointmentTypes'
  | 'documentTypes'
  | 'plans'
  | 'subscriptionStatuses'
  | 'appointmentStatuses';

export interface CatalogItemResponse {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  masterActive: boolean;
  activated: boolean;
  tenantActive: boolean;
  tenantLinkId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterCatalogItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedByName?: string | null;
}

export interface SpecialtyMasterRequest {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface AppointmentTypeMasterRequest {
  code: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
}

export interface DocumentTypeMasterRequest {
  code: string;
  name: string;
  isActive: boolean;
}

export interface SystemCatalogRequest {
  code: string;
  name: string;
  isActive: boolean;
}

export interface PlanResponse {
  id: number;
  name: string;
  code: string;
  price: number;
  maxUsers: number;
  maxBranches: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedByName?: string | null;
}

export interface PlanMasterRequest {
  name: string;
  code: string;
  price: number;
  maxUsers: number;
  maxBranches: number;
  isActive: boolean;
}

export interface DoctorSpecialty {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  isMasterActive?: boolean;
  isAssigned?: boolean;
  tenantActivated?: boolean;
  linkId?: number;
}

export type CatalogItemListApiResponse = ApiResponse<CatalogItemResponse[]>;
export type CatalogItemApiResponse = ApiResponse<CatalogItemResponse>;
export type MasterCatalogListApiResponse = ApiResponse<MasterCatalogItem[]>;
export type MasterCatalogApiResponse = ApiResponse<MasterCatalogItem>;
export type PlanListApiResponse = ApiResponse<PlanResponse[]>;
export type PlanApiResponse = ApiResponse<PlanResponse>;
export type DoctorSpecialtyListApiResponse = ApiResponse<DoctorSpecialty[]>;
