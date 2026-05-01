import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { CreateTriageRequest, TriageApiResponse } from '@core/models/triage.model';

@Injectable({ providedIn: 'root' })
export class TriageService {
  private readonly http = inject(HttpClient);

  create(body: CreateTriageRequest): Observable<TriageApiResponse> {
    return this.http.post<TriageApiResponse>(API_ROUTES.triage.base, body);
  }

  getByAppointment(appointmentId: number): Observable<TriageApiResponse> {
    return this.http.get<TriageApiResponse>(API_ROUTES.triage.byAppointment(appointmentId));
  }
}
