import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  CreateMedicalRecordRequest,
  MedicalRecordApiResponse,
} from '@core/models/medical-record.model';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private readonly http = inject(HttpClient);

  create(body: CreateMedicalRecordRequest): Observable<MedicalRecordApiResponse> {
    return this.http.post<MedicalRecordApiResponse>(API_ROUTES.medicalRecords.base, body);
  }

  getByPatient(patientId: number): Observable<MedicalRecordApiResponse> {
    return this.http.get<MedicalRecordApiResponse>(API_ROUTES.medicalRecords.byPatient(patientId));
  }
}
