import { ApiResponse } from './api-response.model';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'INSURANCE' | 'OTHER';
export type PaymentStatus = 'COMPLETED' | 'PENDING';

export interface CreatePaymentRequest {
  amount: number;
  paymentMethod?: PaymentMethod;
  concept?: string;
  status?: PaymentStatus;
}

export interface PaymentResponse {
  id: number;
  appointmentId: number;
  amount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  concept: string | null;
  paymentDate: string;
  createdAt: string;
  createdBy: number;
}

export type PaymentApiResponse = ApiResponse<PaymentResponse>;
export type PaymentListApiResponse = ApiResponse<PaymentResponse[]>;
