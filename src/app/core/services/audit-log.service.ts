import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { AuditLogListApiResponse, AuditLogParams } from '@core/models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);

  getLog(params: AuditLogParams = {}): Observable<AuditLogListApiResponse> {
    return this.http.get<AuditLogListApiResponse>(API_ROUTES.auditLog.base, {
      params: this.buildParams(params),
    });
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }
}
