import { ApiResponse } from './api-response.model';

export type TenantStatus = 'ACTIVE' | 'INACTIVE';

export interface TenantResponse {
  id: number;
  subdomain: string;
  name: string;
  status: TenantStatus;
  logoUrl: string | null;
  primaryColor: string | null;
  subtitle: string | null;
  createdAt: string;
}

export interface CreateTenantRequest {
  subdomain: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  subtitle?: string;
}

export interface UpdateTenantRequest {
  name: string;
  status: TenantStatus;
  logoUrl?: string;
  primaryColor?: string;
  subtitle?: string;
}

export type TenantApiResponse = ApiResponse<TenantResponse>;
export type TenantListApiResponse = ApiResponse<TenantResponse[]>;
