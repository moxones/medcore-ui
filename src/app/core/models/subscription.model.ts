import { ApiResponse } from './api-response.model';

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface SubscriptionPlanInfo {
  id: number;
  name: string;
  code: string;
  price: number;
  maxUsers: number;
  maxBranches: number;
  isActive: boolean;
}

export interface SubscriptionResponse {
  id: number;
  tenantId: number;
  plan: SubscriptionPlanInfo;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface CreateSubscriptionRequest {
  tenantId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
}

export interface UpdateSubscriptionRequest {
  planId: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
}

export type SubscriptionApiResponse = ApiResponse<SubscriptionResponse>;
export type SubscriptionListApiResponse = ApiResponse<SubscriptionResponse[]>;
