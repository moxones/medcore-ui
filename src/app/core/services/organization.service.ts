import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
  CreateTenantRequest,
  TenantApiResponse,
  TenantListApiResponse,
  UpdateTenantRequest,
} from '@core/models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);

  getList(): Observable<TenantListApiResponse> {
    return this.http.get<TenantListApiResponse>(API_ROUTES.organizations.base);
  }

  getById(id: number): Observable<TenantApiResponse> {
    return this.http.get<TenantApiResponse>(API_ROUTES.organizations.byId(id));
  }

  create(body: CreateTenantRequest): Observable<TenantApiResponse> {
    return this.http.post<TenantApiResponse>(API_ROUTES.organizations.base, body);
  }

  update(id: number, body: UpdateTenantRequest): Observable<TenantApiResponse> {
    return this.http.put<TenantApiResponse>(API_ROUTES.organizations.byId(id), body);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.organizations.byId(id));
  }
}
