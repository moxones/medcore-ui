import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  GlobalDashboardSummaryApiResponse,
  EnrichedTenantPageApiResponse,
} from '@core/models/super-admin.model';

@Injectable({ providedIn: 'root' })
export class SuperAdminDashboardService {
  private readonly http = inject(HttpClient);

  getGlobalSummary(): Observable<GlobalDashboardSummaryApiResponse> {
    return this.http.get<GlobalDashboardSummaryApiResponse>(API_ROUTES.superAdminDashboard.summary);
  }

  getEnrichedTenants(
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt,desc'
  ): Observable<EnrichedTenantPageApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    return this.http.get<EnrichedTenantPageApiResponse>(API_ROUTES.superAdminDashboard.tenants, {
      params,
    });
  }
}
