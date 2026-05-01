import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
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

  getSpecialties(): Observable<SpecialtyListApiResponse> {
    return this.http.get<SpecialtyListApiResponse>(API_ROUTES.catalogs.specialties);
  }

  createSpecialty(body: CreateSpecialtyRequest): Observable<SpecialtyApiResponse> {
    return this.http.post<SpecialtyApiResponse>(API_ROUTES.catalogs.specialties, body);
  }

  deleteSpecialty(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.specialtyById(id));
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

  getAppointmentTypes(): Observable<CatalogItemListApiResponse> {
    return this.http.get<CatalogItemListApiResponse>(API_ROUTES.catalogs.appointmentTypes);
  }

  createAppointmentType(body: CreateCatalogItemRequest): Observable<CatalogItemApiResponse> {
    return this.http.post<CatalogItemApiResponse>(API_ROUTES.catalogs.appointmentTypes, body);
  }

  deleteAppointmentType(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.catalogs.appointmentTypeById(id));
  }
}
