import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  CreateTriageRequest,
  TriageApiResponse,
  TriageListApiResponse,
  TriageListParams,
  TriageSummaryListApiResponse,
} from '@core/models/triage.model';

@Injectable({ providedIn: 'root' })
export class TriageService {
  private readonly http = inject(HttpClient);

  create(body: CreateTriageRequest): Observable<TriageApiResponse> {
    return this.http.post<TriageApiResponse>(API_ROUTES.triage.base, body);
  }

  getByAppointment(appointmentId: number): Observable<TriageListApiResponse> {
    return this.http.get<TriageListApiResponse>(API_ROUTES.triage.byAppointment(appointmentId));
  }

  getLatestByAppointment(appointmentId: number): Observable<TriageApiResponse> {
    return this.http.get<TriageApiResponse>(API_ROUTES.triage.latestByAppointment(appointmentId));
  }

  getById(id: number): Observable<TriageApiResponse> {
    return this.http.get<TriageApiResponse>(API_ROUTES.triage.byId(id));
  }

  getToday(filters: TriageListParams = {}): Observable<TriageSummaryListApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<TriageSummaryListApiResponse>(API_ROUTES.triage.today, { params });
  }

  getByPatient(patientId: number): Observable<TriageSummaryListApiResponse> {
    return this.http.get<TriageSummaryListApiResponse>(API_ROUTES.triage.byPatient(patientId));
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }
}
