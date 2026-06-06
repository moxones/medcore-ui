import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { DoctorDashboardApiResponse } from '@core/models/doctor-dashboard.model';

@Injectable({ providedIn: 'root' })
export class DoctorDashboardService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DoctorDashboardApiResponse> {
    return this.http.get<DoctorDashboardApiResponse>(API_ROUTES.dashboard.doctorSummary);
  }
}
