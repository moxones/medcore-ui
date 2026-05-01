import { ApiResponse } from './api-response.model';
import { PagedResponse, PageRequest } from './pagination.model';

export type AppointmentFlowStatus =
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  branchId: number;
  scheduledAt: string;
  appointmentTypeId: number;
  reason: string;
}

export interface AppointmentResponse {
  id: number;
  patientName: string;
  doctorName: string;
  branchName: string;
  scheduledAt: string;
  statusId: number;
  flowStatus: AppointmentFlowStatus;
}

export interface CalendarAppointmentResponse {
  id: number;
  scheduledAt: string;
  doctorName: string;
}

export interface TimeSlotResponse {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RescheduleAppointmentRequest {
  newScheduledAt: string;
  reason: string;
}

export interface UpdateFlowStatusRequest {
  flowStatus: AppointmentFlowStatus;
}

export interface CancelAppointmentRequest {
  reason: string;
}

export interface AppointmentListParams extends PageRequest {
  doctorId?: number;
  statusId?: number;
  date?: string;
}

export interface CalendarParams {
  startDate: string;
  endDate: string;
  doctorId?: number;
}

export interface AvailableSlotsParams {
  doctorId: number;
  date: string;
}

export type AppointmentApiResponse = ApiResponse<AppointmentResponse>;
export type AppointmentListApiResponse = ApiResponse<PagedResponse<AppointmentResponse>>;
export type CalendarApiResponse = ApiResponse<CalendarAppointmentResponse[]>;
export type TimeSlotsApiResponse = ApiResponse<TimeSlotResponse[]>;
