import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  CreateDoctorRequest,
  DoctorApiResponse,
  DoctorListApiResponse,
} from '@core/models/doctor.model';
import { PageRequest } from '@core/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);

  getList(pagination: PageRequest = {}): Observable<DoctorListApiResponse> {
    const params = new HttpParams()
      .set('page', pagination.page ?? 0)
      .set('size', pagination.size ?? 20);
    return this.http.get<DoctorListApiResponse>(API_ROUTES.doctors.base, { params });
  }

  getById(id: number): Observable<DoctorApiResponse> {
    return this.http.get<DoctorApiResponse>(API_ROUTES.doctors.byId(id));
  }

  create(body: CreateDoctorRequest): Observable<DoctorApiResponse> {
    return this.http.post<DoctorApiResponse>(API_ROUTES.doctors.base, body);
  }
}
