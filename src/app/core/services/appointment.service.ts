import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  AppointmentApiResponse,
  AppointmentListApiResponse,
  AppointmentListParams,
  AvailableSlotsParams,
  CalendarApiResponse,
  CalendarParams,
  CancelAppointmentRequest,
  CreateAppointmentRequest,
  MyAppointmentsApiResponse,
  MyAppointmentsParams,
  QueueApiResponse,
  QueueParams,
  RescheduleAppointmentRequest,
  TimeSlotsApiResponse,
  UpdateFlowStatusRequest,
} from '@core/models/appointment.model';
import {
  AvailabilityApiResponse,
  AvailabilityParams,
  SpecialtySummaryListApiResponse,
} from '@core/models/availability.model';
import { ApiResponse } from '@core/models/api-response.model';


@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);

  create(body: CreateAppointmentRequest): Observable<AppointmentApiResponse> {
    return this.http.post<AppointmentApiResponse>(API_ROUTES.appointments.base, body);
  }

  getList(filters: AppointmentListParams = {}): Observable<AppointmentListApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<AppointmentListApiResponse>(API_ROUTES.appointments.base, { params });
  }

  getMyAppointments(filters: MyAppointmentsParams = {}): Observable<MyAppointmentsApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<MyAppointmentsApiResponse>(API_ROUTES.patients.myAppointments, { params });
  }

  getCalendar(filters: CalendarParams): Observable<CalendarApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<CalendarApiResponse>(API_ROUTES.appointments.calendar, { params });
  }

  getAvailableSlots(filters: AvailableSlotsParams): Observable<TimeSlotsApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<TimeSlotsApiResponse>(API_ROUTES.appointments.availableSlots, { params });
  }

  getAvailability(filters: AvailabilityParams): Observable<AvailabilityApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<AvailabilityApiResponse>(API_ROUTES.appointments.availability, { params });
  }

  getSpecialtiesSummary(branchId: number): Observable<SpecialtySummaryListApiResponse> {
    const params = this.buildParams({ branchId });
    return this.http.get<SpecialtySummaryListApiResponse>(
      API_ROUTES.appointments.specialtiesSummary,
      { params },
    );
  }

  getById(id: number): Observable<AppointmentApiResponse> {
    return this.http.get<AppointmentApiResponse>(API_ROUTES.appointments.byId(id));
  }

  reschedule(id: number, body: RescheduleAppointmentRequest): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(API_ROUTES.appointments.reschedule(id), body);
  }

  updateFlowStatus(id: number, body: UpdateFlowStatusRequest): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(API_ROUTES.appointments.flowStatus(id), body);
  }

  cancel(id: number, body: CancelAppointmentRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(API_ROUTES.appointments.cancel(id), body);
  }

  getQueue(filters: QueueParams = {}): Observable<QueueApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<QueueApiResponse>(API_ROUTES.appointments.queue, { params });
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }
}
