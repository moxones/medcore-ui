import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  PatientApiResponse,
  PatientListApiResponse,
  PatientSearchParams,
} from '@core/models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  getList(params: PatientSearchParams = {}): Observable<PatientListApiResponse> {
    const httpParams = this.buildParams(params);
    return this.http.get<PatientListApiResponse>(API_ROUTES.patients.base, { params: httpParams });
  }

  search(query: string): Observable<PatientListApiResponse> {
    const params = new HttpParams().set('query', query);
    return this.http.get<PatientListApiResponse>(API_ROUTES.patients.search, { params });
  }

  getById(id: number): Observable<PatientApiResponse> {
    return this.http.get<PatientApiResponse>(API_ROUTES.patients.byId(id));
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((p, [k, v]) => p.set(k, String(v)), new HttpParams());
  }
}
