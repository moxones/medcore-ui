import { ApiResponse } from './api-response.model';

export interface DashboardSummaryResponse {
  totalAppointmentsToday: number;
  cancelledAppointmentsToday: number;
  completedAppointmentsToday: number;
  totalRevenueThisMonth: number;
  noShowRatePercentage: number;
}

export interface DoctorProductivityResponse {
  doctorId: number;
  doctorName: string;
  totalAppointments: number;
}

export type DashboardSummaryApiResponse = ApiResponse<DashboardSummaryResponse>;
export type DoctorProductivityApiResponse = ApiResponse<DoctorProductivityResponse[]>;
