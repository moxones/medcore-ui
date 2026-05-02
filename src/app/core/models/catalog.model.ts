import { ApiResponse } from './api-response.model';

export interface CatalogItemResponse {
  id: number;
  code: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number | null;
  updatedById?: number | null;
  updatedByName?: string | null;
}

export interface CreateCatalogItemRequest {
  code: string;
  name: string;
}

export interface SpecialtyResponse extends CatalogItemResponse {
  tenantId?: number;
  isActive?: boolean;
  doctorCount?: number;
}

export interface CreateSpecialtyRequest extends CreateCatalogItemRequest {}

export interface AppointmentTypeResponse extends CatalogItemResponse {
  tenantId?: number;
  isActive?: boolean;
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
  createdById?: number | null;
  updatedById?: number | null;
  updatedByName?: string | null;
}

export interface CreatePlanRequest {
  name: string;
  code: string;
  price: number;
  maxUsers: number;
  maxBranches: number;
}

export type SpecialtyApiResponse = ApiResponse<SpecialtyResponse>;
export type SpecialtyListApiResponse = ApiResponse<SpecialtyResponse[]>;
export type AppointmentTypeApiResponse = ApiResponse<AppointmentTypeResponse>;
export type AppointmentTypeListApiResponse = ApiResponse<AppointmentTypeResponse[]>;
export type PlanApiResponse = ApiResponse<PlanResponse>;
export type PlanListApiResponse = ApiResponse<PlanResponse[]>;
export type CatalogItemApiResponse = ApiResponse<CatalogItemResponse>;
export type CatalogItemListApiResponse = ApiResponse<CatalogItemResponse[]>;
