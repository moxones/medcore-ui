import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
  AppointmentTypeMasterRequest,
  CatalogItemApiResponse,
  CatalogItemListApiResponse,
  DocumentTypeMasterRequest,
  MasterCatalogApiResponse,
  MasterCatalogListApiResponse,
  PlanApiResponse,
  PlanListApiResponse,
  PlanMasterRequest,
  SpecialtyMasterRequest,
  SystemCatalogRequest,
} from '@core/models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  private get<T>(url: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(url);
  }

  private post<T, B>(url: string, body: B): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(url, body);
  }

  private put<T, B>(url: string, body: B): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(url, body);
  }

  private remove(url: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(url);
  }

  listMasterSpecialties(): Observable<MasterCatalogListApiResponse> {
    return this.get(API_ROUTES.superAdmin.catalogs.specialties);
  }

  createMasterSpecialty(body: SpecialtyMasterRequest): Observable<MasterCatalogApiResponse> {
    return this.post(API_ROUTES.superAdmin.catalogs.specialties, body);
  }

  updateMasterSpecialty(id: number, body: SpecialtyMasterRequest): Observable<MasterCatalogApiResponse> {
    return this.put(API_ROUTES.superAdmin.catalogs.specialtyById(id), body);
  }

  deleteMasterSpecialty(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.superAdmin.catalogs.specialtyById(id));
  }

  listMasterAppointmentTypes(): Observable<MasterCatalogListApiResponse> {
    return this.get(API_ROUTES.superAdmin.catalogs.appointmentTypes);
  }

  createMasterAppointmentType(body: AppointmentTypeMasterRequest): Observable<MasterCatalogApiResponse> {
    return this.post(API_ROUTES.superAdmin.catalogs.appointmentTypes, body);
  }

  updateMasterAppointmentType(id: number, body: AppointmentTypeMasterRequest): Observable<MasterCatalogApiResponse> {
    return this.put(API_ROUTES.superAdmin.catalogs.appointmentTypeById(id), body);
  }

  deleteMasterAppointmentType(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.superAdmin.catalogs.appointmentTypeById(id));
  }

  listMasterDocumentTypes(): Observable<MasterCatalogListApiResponse> {
    return this.get(API_ROUTES.superAdmin.catalogs.documentTypes);
  }

  createMasterDocumentType(body: DocumentTypeMasterRequest): Observable<MasterCatalogApiResponse> {
    return this.post(API_ROUTES.superAdmin.catalogs.documentTypes, body);
  }

  updateMasterDocumentType(id: number, body: DocumentTypeMasterRequest): Observable<MasterCatalogApiResponse> {
    return this.put(API_ROUTES.superAdmin.catalogs.documentTypeById(id), body);
  }

  deleteMasterDocumentType(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.superAdmin.catalogs.documentTypeById(id));
  }

  listMasterPlans(): Observable<PlanListApiResponse> {
    return this.get(API_ROUTES.superAdmin.catalogs.plans);
  }

  createMasterPlan(body: PlanMasterRequest): Observable<PlanApiResponse> {
    return this.post(API_ROUTES.superAdmin.catalogs.plans, body);
  }

  updateMasterPlan(id: number, body: PlanMasterRequest): Observable<PlanApiResponse> {
    return this.put(API_ROUTES.superAdmin.catalogs.planById(id), body);
  }

  deleteMasterPlan(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.superAdmin.catalogs.planById(id));
  }

  listMasterSubscriptionStatuses(): Observable<MasterCatalogListApiResponse> {
    return this.get(API_ROUTES.superAdmin.catalogs.subscriptionStatuses);
  }

  createMasterSubscriptionStatus(body: SystemCatalogRequest): Observable<MasterCatalogApiResponse> {
    return this.post(API_ROUTES.superAdmin.catalogs.subscriptionStatuses, body);
  }

  updateMasterSubscriptionStatus(id: number, body: SystemCatalogRequest): Observable<MasterCatalogApiResponse> {
    return this.put(API_ROUTES.superAdmin.catalogs.subscriptionStatusById(id), body);
  }

  deleteMasterSubscriptionStatus(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.superAdmin.catalogs.subscriptionStatusById(id));
  }

  listMasterAppointmentStatuses(): Observable<MasterCatalogListApiResponse> {
    return this.get(API_ROUTES.superAdmin.catalogs.appointmentStatuses);
  }

  createMasterAppointmentStatus(body: SystemCatalogRequest): Observable<MasterCatalogApiResponse> {
    return this.post(API_ROUTES.superAdmin.catalogs.appointmentStatuses, body);
  }

  updateMasterAppointmentStatus(id: number, body: SystemCatalogRequest): Observable<MasterCatalogApiResponse> {
    return this.put(API_ROUTES.superAdmin.catalogs.appointmentStatusById(id), body);
  }

  deleteMasterAppointmentStatus(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.superAdmin.catalogs.appointmentStatusById(id));
  }

  getClinicSpecialties(): Observable<CatalogItemListApiResponse> {
    return this.get(API_ROUTES.catalogs.specialties);
  }

  getAvailableSpecialties(): Observable<CatalogItemListApiResponse> {
    return this.get(API_ROUTES.catalogs.specialtiesAvailable);
  }

  activateSpecialty(id: number): Observable<CatalogItemApiResponse> {
    return this.post(API_ROUTES.catalogs.specialtyLink(id), {});
  }

  deactivateSpecialty(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.catalogs.specialtyLink(id));
  }

  getClinicAppointmentTypes(): Observable<CatalogItemListApiResponse> {
    return this.get(API_ROUTES.catalogs.appointmentTypes);
  }

  getAvailableAppointmentTypes(): Observable<CatalogItemListApiResponse> {
    return this.get(API_ROUTES.catalogs.appointmentTypesAvailable);
  }

  activateAppointmentType(id: number, durationMinutes?: number): Observable<CatalogItemApiResponse> {
    const url = API_ROUTES.catalogs.appointmentTypeLink(id);
    if (durationMinutes === undefined) {
      return this.post(url, {});
    }
    const params = new HttpParams().set('durationMinutes', String(durationMinutes));
    return this.http.post<CatalogItemApiResponse>(url, {}, { params });
  }

  deactivateAppointmentType(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.catalogs.appointmentTypeLink(id));
  }

  getClinicDocumentTypes(): Observable<CatalogItemListApiResponse> {
    return this.get(API_ROUTES.catalogs.documentTypes);
  }

  getAvailableDocumentTypes(): Observable<CatalogItemListApiResponse> {
    return this.get(API_ROUTES.catalogs.documentTypesAvailable);
  }

  activateDocumentType(id: number): Observable<CatalogItemApiResponse> {
    return this.post(API_ROUTES.catalogs.documentTypeLink(id), {});
  }

  deactivateDocumentType(id: number): Observable<ApiResponse<null>> {
    return this.remove(API_ROUTES.catalogs.documentTypeLink(id));
  }

  getClinicPlans(): Observable<PlanListApiResponse> {
    return this.get(API_ROUTES.catalogs.plans);
  }

  getClinicSubscriptionStatuses(): Observable<MasterCatalogListApiResponse> {
    return this.get(API_ROUTES.catalogs.subscriptionStatuses);
  }

  getClinicAppointmentStatuses(): Observable<MasterCatalogListApiResponse> {
    return this.get(API_ROUTES.catalogs.appointmentStatuses);
  }
}
