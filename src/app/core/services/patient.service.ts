import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
  PatientApiResponse,
  PatientListApiResponse,
  PatientSearchApiResponse,
  PatientSearchParams,
  PatientRegisterRequest,
  PatientRegisterResult,
  EmailAvailabilityResult,
  UpdateProfileRequest,
  UpdatePatientRequest,
  PatientProfileResponse,
  CreatePatientRequest,
} from '@core/models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  getList(params: PatientSearchParams = {}): Observable<PatientListApiResponse> {
    const httpParams = this.buildParams(params);
    return this.http.get<PatientListApiResponse>(API_ROUTES.patients.base, { params: httpParams });
  }

  search(query: string): Observable<PatientSearchApiResponse> {
    const params = new HttpParams().set('query', query);
    return this.http.get<PatientSearchApiResponse>(API_ROUTES.patients.search, { params });
  }

  create(data: CreatePatientRequest): Observable<PatientApiResponse> {
    return this.http.post<PatientApiResponse>(API_ROUTES.patients.base, data);
  }

  getById(id: number): Observable<PatientApiResponse> {
    return this.http.get<PatientApiResponse>(API_ROUTES.patients.byId(id));
  }

  update(id: number, data: UpdatePatientRequest): Observable<PatientApiResponse> {
    return this.http.put<PatientApiResponse>(API_ROUTES.patients.byId(id), data);
  }

  checkEmail(email: string): Observable<ApiResponse<EmailAvailabilityResult>> {
    const params = new HttpParams().set('email', email);
    return this.http.get<ApiResponse<EmailAvailabilityResult>>(API_ROUTES.public.checkEmail, { params });
  }

  registerPatient(data: PatientRegisterRequest): Observable<ApiResponse<PatientRegisterResult>> {
    return this.http.post<ApiResponse<PatientRegisterResult>>(API_ROUTES.public.registerPatient, data);
  }

  getProfile(): Observable<PatientProfileResponse> {
    return this.http.get<PatientProfileResponse>(API_ROUTES.patients.profile);
  }

  updateProfile(data: UpdateProfileRequest): Observable<void> {
    return this.http.put<void>(API_ROUTES.patients.profile, data);
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((p, [k, v]) => p.set(k, String(v)), new HttpParams());
  }
}
