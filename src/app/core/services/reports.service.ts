import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  ReportFilters,
  ReportFormat,
  ReportResultApiResponse,
} from '@core/models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);

  getReport(key: string, filters: ReportFilters): Observable<ReportResultApiResponse> {
    return this.http.get<ReportResultApiResponse>(API_ROUTES.reports.data(key), {
      params: this.buildParams(filters),
    });
  }

  exportReport(key: string, format: ReportFormat, filters: ReportFilters): Observable<Blob> {
    return this.http.get(API_ROUTES.reports.export(key), {
      params: this.buildParams({ ...filters, format }),
      responseType: 'blob',
    });
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .reduce((params, [key, value]) => params.set(key, String(value)), new HttpParams());
  }
}
