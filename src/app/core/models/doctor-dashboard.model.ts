import { ApiResponse } from './api-response.model';
import { AppointmentFlowStatus } from './appointment.model';

export interface DoctorAgendaItem {
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientInitials: string;
  scheduledAt: string;
  durationMinutes: number;
  reason: string | null;
  appointmentType: string | null;
  flowStatus: AppointmentFlowStatus;
  isNewPatient: boolean;
}

export interface DoctorRecentPatient {
  patientId: number;
  patientName: string;
  patientInitials: string;
  lastVisitAt: string;
  lastReason: string | null;
}

export interface DoctorDashboardSummary {
  totalToday: number;
  upcoming: number;
  waiting: number;
  inProgress: number;
  completedToday: number;
  pendingNotes: number;
  avgConsultationMinutes: number;
  nextPatient: DoctorAgendaItem | null;
  agenda: DoctorAgendaItem[];
  recentPatients: DoctorRecentPatient[];
}

export type DoctorDashboardApiResponse = ApiResponse<DoctorDashboardSummary>;
