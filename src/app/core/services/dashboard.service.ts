import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  DashboardSummaryApiResponse,
  DoctorProductivityApiResponse,
} from '@core/models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummaryApiResponse> {
    return this.http.get<DashboardSummaryApiResponse>(API_ROUTES.dashboard.summary);
  }

  getProductivity(): Observable<DoctorProductivityApiResponse> {
    return this.http.get<DoctorProductivityApiResponse>(API_ROUTES.dashboard.productivity);
  }
}
