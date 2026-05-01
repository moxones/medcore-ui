import { ApiResponse } from './api-response.model';

export interface CreateBookingRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  documentTypeCode: string;
  documentNumber: string;
  birthDate: string;
  doctorId: number;
  branchId: number;
  scheduledAt: string;
  reason: string;
}

export interface BookingResponse {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  branchName: string;
  scheduledAt: string;
}

export type BookingApiResponse = ApiResponse<BookingResponse>;
