import { ApiResponse } from './api-response.model';
import { PagedResponse, PageRequest, SpringPage } from './pagination.model';

export type AppointmentFlowStatus =
  | 'SCHEDULED'
  | 'WAITING'
  | 'CALLED'
  | 'IN_PROCESS'
  | 'PENDING_PAYMENT'
  | 'COMPLETED';

export type BookingSource = 'SELF' | 'PHONE' | 'IN_PERSON' | 'RECEPTION' | 'WALK_IN';

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
  status: string;
  appointmentTypeId: number | null;
  reason: string | null;
  durationMinutes: number;
  flowStatus: AppointmentFlowStatus;
  createdAt: string;
  bookingSource: BookingSource | null;
  checkedInAt: string | null;
  calledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  completedAt: string | null;
  amount: number | null;
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

export interface MyAppointmentsParams extends PageRequest {
  flowStatus?: AppointmentFlowStatus;
}

export interface CalendarParams {
  startDate: string;
  endDate: string;
  doctorId?: number;
  branchId?: number;
}

export interface QueueParams {
  branchId?: number;
  doctorId?: number;
  date?: string;
}

export interface AvailableSlotsParams {
  doctorId: number;
  branchId: number;
  date: string;
}

export type AppointmentApiResponse = ApiResponse<AppointmentResponse>;
export type AppointmentListApiResponse = ApiResponse<PagedResponse<AppointmentResponse>>;
export type MyAppointmentsApiResponse = ApiResponse<SpringPage<AppointmentResponse>>;
export type CalendarApiResponse = ApiResponse<AppointmentResponse[]>;
export type TimeSlotsApiResponse = ApiResponse<TimeSlotResponse[]>;
export type QueueApiResponse = ApiResponse<AppointmentResponse[]>;
