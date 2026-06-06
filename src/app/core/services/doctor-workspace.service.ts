import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
  DoctorOrderListApiResponse,
  DoctorOrdersParams,
  DoctorPatientPageApiResponse,
  DoctorPatientsParams,
  DoctorPrescriptionsParams,
  DoctorProfileApiResponse,
  NoteTemplateApiResponse,
  NoteTemplateListApiResponse,
  PrescriptionDocumentPageApiResponse,
  SaveNoteTemplateRequest,
} from '@core/models/doctor-workspace.model';

@Injectable({ providedIn: 'root' })
export class DoctorWorkspaceService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<DoctorProfileApiResponse> {
    return this.http.get<DoctorProfileApiResponse>(API_ROUTES.doctors.meProfile);
  }

  getPatients(params: DoctorPatientsParams = {}): Observable<DoctorPatientPageApiResponse> {
    return this.http.get<DoctorPatientPageApiResponse>(API_ROUTES.doctors.mePatients, {
      params: this.buildParams({ page: 0, size: 24, ...params }),
    });
  }

  getPrescriptions(
    params: DoctorPrescriptionsParams = {},
  ): Observable<PrescriptionDocumentPageApiResponse> {
    return this.http.get<PrescriptionDocumentPageApiResponse>(API_ROUTES.doctors.mePrescriptions, {
      params: this.buildParams({ page: 0, size: 20, ...params }),
    });
  }

  getOrders(params: DoctorOrdersParams = {}): Observable<DoctorOrderListApiResponse> {
    return this.http.get<DoctorOrderListApiResponse>(API_ROUTES.doctors.meOrders, {
      params: this.buildParams(params),
    });
  }

  getTemplates(): Observable<NoteTemplateListApiResponse> {
    return this.http.get<NoteTemplateListApiResponse>(API_ROUTES.doctors.meTemplates);
  }

  createTemplate(body: SaveNoteTemplateRequest): Observable<NoteTemplateApiResponse> {
    return this.http.post<NoteTemplateApiResponse>(API_ROUTES.doctors.meTemplates, body);
  }

  updateTemplate(
    id: number,
    body: SaveNoteTemplateRequest,
  ): Observable<NoteTemplateApiResponse> {
    return this.http.put<NoteTemplateApiResponse>(API_ROUTES.doctors.meTemplateById(id), body);
  }

  deleteTemplate(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.doctors.meTemplateById(id));
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }
}
