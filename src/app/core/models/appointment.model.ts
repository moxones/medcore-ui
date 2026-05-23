import { ApiResponse } from './api-response.model';
import { PagedResponse, PageRequest } from './pagination.model';

export type AppointmentFlowStatus = 'WAITING' | 'IN_PROCESS' | 'COMPLETED';

export type BookingSource = 'SELF' | 'PHONE' | 'IN_PERSON';

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  branchId: number;
  scheduledAt: string;
  appointmentTypeId?: number;
  reason?: string;
  bookingSource?: BookingSource;
}

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  branchId: number;
  branchName: string;
  scheduledAt: string;
  statusId: number;
  appointmentTypeId: number | null;
  reason: string | null;
  durationMinutes: number;
  flowStatus: AppointmentFlowStatus;
  createdAt: string;
  bookingSource: BookingSource | null;
}

export interface TimeSlotResponse {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RescheduleAppointmentRequest {
  newScheduledAt: string;
  reason?: string;
}

export interface UpdateFlowStatusRequest {
  flowStatus: AppointmentFlowStatus;
}

export interface CancelAppointmentRequest {
  reason: string;
}

export interface AppointmentListParams extends PageRequest {
  doctorId?: number;
  patientId?: number;
  statusId?: number;
  date?: string;
  flowStatus?: AppointmentFlowStatus;
}

export interface CalendarParams {
  startDate: string;
  endDate: string;
  doctorId?: number;
  branchId?: number;
}

export interface AvailableSlotsParams {
  doctorId: number;
  branchId: number;
  date: string;
}

export type AppointmentApiResponse = ApiResponse<AppointmentResponse>;
export type AppointmentListApiResponse = ApiResponse<PagedResponse<AppointmentResponse>>;
export type CalendarApiResponse = ApiResponse<AppointmentResponse[]>;
export type TimeSlotsApiResponse = ApiResponse<TimeSlotResponse[]>;
