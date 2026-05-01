import { ApiResponse } from './api-response.model';

export interface CatalogItemResponse {
  id: number;
  code: string;
  name: string;
}

export interface CreateCatalogItemRequest {
  code: string;
  name: string;
}

export interface SpecialtyResponse extends CatalogItemResponse {}
export interface CreateSpecialtyRequest extends CreateCatalogItemRequest {}

export interface PlanResponse {
  id: number;
  name: string;
  code: string;
  price: number;
  maxUsers: number;
  maxBranches: number;
  isActive: boolean;
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
export type PlanApiResponse = ApiResponse<PlanResponse>;
export type PlanListApiResponse = ApiResponse<PlanResponse[]>;
export type CatalogItemApiResponse = ApiResponse<CatalogItemResponse>;
export type CatalogItemListApiResponse = ApiResponse<CatalogItemResponse[]>;
