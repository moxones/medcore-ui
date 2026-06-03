import { ApiResponse } from './api-response.model';

export type BookingMode = 'specialty' | 'doctor';

export type DateRangeKey = 'today' | 'next7' | 'next14' | 'next30';

export type DayNavKey = 'today' | 'tomorrow' | 'week';

export type TimeOfDayKey = 'all' | 'morning' | 'afternoon';

export interface SpecialtySummaryResponse {
  id: number;
  code: string;
  name: string;
  doctorCount: number;
  nextAvailableDate: string | null;
}

export interface AvailabilityParams {
  branchId: number;
  fromDate: string;
  toDate: string;
  specialtyId?: number;
  doctorId?: number;
  appointmentTypeId?: number;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  doctorId: number;
  doctorName: string;
  doctorInitials: string;
  specialtyName: string;
  durationMinutes: number;
}

export interface DayAvailability {
  date: string;
  slots: AvailabilitySlot[];
}

export type SpecialtySummaryListApiResponse = ApiResponse<SpecialtySummaryResponse[]>;
export type AvailabilityApiResponse = ApiResponse<DayAvailability[]>;
