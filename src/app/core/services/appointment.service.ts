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
  RescheduleAppointmentRequest,
  TimeSlotsApiResponse,
  UpdateFlowStatusRequest,
} from '@core/models/appointment.model';
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

  getCalendar(filters: CalendarParams): Observable<CalendarApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<CalendarApiResponse>(API_ROUTES.appointments.calendar, { params });
  }

  getAvailableSlots(filters: AvailableSlotsParams): Observable<TimeSlotsApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<TimeSlotsApiResponse>(API_ROUTES.appointments.availableSlots, { params });
  }

  reschedule(id: number, body: RescheduleAppointmentRequest): Observable<AppointmentApiResponse> {
    return this.http.put<AppointmentApiResponse>(API_ROUTES.appointments.reschedule(id), body);
  }

  updateFlowStatus(id: number, body: UpdateFlowStatusRequest): Observable<AppointmentApiResponse> {
    return this.http.patch<AppointmentApiResponse>(API_ROUTES.appointments.flowStatus(id), body);
  }

  cancel(id: number, body: CancelAppointmentRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(API_ROUTES.appointments.cancel(id), body);
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }
}
