import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
  AppointmentTypeApiResponse,
  AppointmentTypeListApiResponse,
  CatalogItemApiResponse,
  CatalogItemListApiResponse,
  CreateCatalogItemRequest,
  CreatePlanRequest,
  CreateSpecialtyRequest,
  PlanApiResponse,
  PlanListApiResponse,
  SpecialtyApiResponse,
  SpecialtyListApiResponse,
} from '@core/models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }

  getSpecialties(): Observable<SpecialtyListApiResponse> {
    return this.http.get<SpecialtyListApiResponse>(API_ROUTES.catalogs.specialties);
  }

  createSpecialty(body: CreateSpecialtyRequest): Observable<SpecialtyApiResponse> {
    return this.http.post<SpecialtyApiResponse>(API_ROUTES.catalogs.specialties, body);
  }

  deleteSpecialty(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.specialtyById(id));
  }

  getSuperAdminSpecialties(tenantId: number): Observable<SpecialtyListApiResponse> {
    const params = this.buildParams({ tenantId });
    return this.http.get<SpecialtyListApiResponse>(API_ROUTES.superAdmin.catalogs.specialties, { params });
  }

  createSuperAdminSpecialty(body: CreateSpecialtyRequest, tenantId: number): Observable<SpecialtyApiResponse> {
    const params = this.buildParams({ tenantId });
    return this.http.post<SpecialtyApiResponse>(API_ROUTES.superAdmin.catalogs.specialties, body, { params });
  }

  deleteSuperAdminSpecialty(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.superAdmin.catalogs.specialtyById(id));
  }

  getPlans(): Observable<PlanListApiResponse> {
    return this.http.get<PlanListApiResponse>(API_ROUTES.catalogs.plans);
  }

  createPlan(body: CreatePlanRequest): Observable<PlanApiResponse> {
    return this.http.post<PlanApiResponse>(API_ROUTES.catalogs.plans, body);
  }

  deletePlan(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.planById(id));
  }

  getDocumentTypes(): Observable<CatalogItemListApiResponse> {
    return this.http.get<CatalogItemListApiResponse>(API_ROUTES.catalogs.documentTypes);
  }

  createDocumentType(body: CreateCatalogItemRequest): Observable<CatalogItemApiResponse> {
    return this.http.post<CatalogItemApiResponse>(API_ROUTES.catalogs.documentTypes, body);
  }

  deleteDocumentType(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.documentTypeById(id));
  }

  getSubscriptionStatuses(): Observable<CatalogItemListApiResponse> {
    return this.http.get<CatalogItemListApiResponse>(API_ROUTES.catalogs.subscriptionStatuses);
  }

  createSubscriptionStatus(body: CreateCatalogItemRequest): Observable<CatalogItemApiResponse> {
    return this.http.post<CatalogItemApiResponse>(API_ROUTES.catalogs.subscriptionStatuses, body);
  }

  deleteSubscriptionStatus(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.subscriptionStatusById(id));
  }

  getAppointmentStatuses(): Observable<CatalogItemListApiResponse> {
    return this.http.get<CatalogItemListApiResponse>(API_ROUTES.catalogs.appointmentStatuses);
  }

  createAppointmentStatus(body: CreateCatalogItemRequest): Observable<CatalogItemApiResponse> {
    return this.http.post<CatalogItemApiResponse>(API_ROUTES.catalogs.appointmentStatuses, body);
  }

  deleteAppointmentStatus(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.appointmentStatusById(id));
  }

  getAppointmentTypes(): Observable<AppointmentTypeListApiResponse> {
    return this.http.get<AppointmentTypeListApiResponse>(API_ROUTES.catalogs.appointmentTypes);
  }

  createAppointmentType(body: CreateCatalogItemRequest): Observable<AppointmentTypeApiResponse> {
    return this.http.post<AppointmentTypeApiResponse>(API_ROUTES.catalogs.appointmentTypes, body);
  }

  deleteAppointmentType(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.appointmentTypeById(id));
  }

  getSuperAdminAppointmentTypes(tenantId: number): Observable<AppointmentTypeListApiResponse> {
    const params = this.buildParams({ tenantId });
    return this.http.get<AppointmentTypeListApiResponse>(API_ROUTES.superAdmin.catalogs.appointmentTypes, { params });
  }

  createSuperAdminAppointmentType(body: CreateCatalogItemRequest, tenantId: number): Observable<AppointmentTypeApiResponse> {
    const params = this.buildParams({ tenantId });
    return this.http.post<AppointmentTypeApiResponse>(API_ROUTES.superAdmin.catalogs.appointmentTypes, body, { params });
  }

  deleteSuperAdminAppointmentType(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.superAdmin.catalogs.appointmentTypeById(id));
  }
}
