import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  CreateMedicalEntryRequest,
  MedicalEntryApiResponse,
  MedicalEntryListApiResponse,
  MedicalRecordApiResponse,
  UpdateClinicalRequest,
} from '@core/models/medical-record.model';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private readonly http = inject(HttpClient);

  getByPatient(patientId: number): Observable<MedicalRecordApiResponse> {
    return this.http.get<MedicalRecordApiResponse>(API_ROUTES.medicalRecords.byPatient(patientId));
  }

  getMe(): Observable<MedicalRecordApiResponse> {
    return this.http.get<MedicalRecordApiResponse>(API_ROUTES.medicalRecords.me);
  }

  createEntry(body: CreateMedicalEntryRequest): Observable<MedicalEntryApiResponse> {
    return this.http.post<MedicalEntryApiResponse>(API_ROUTES.medicalRecords.entries, body);
  }

  getEntryById(entryId: number): Observable<MedicalEntryApiResponse> {
    return this.http.get<MedicalEntryApiResponse>(API_ROUTES.medicalRecords.entryById(entryId));
  }

  getEntriesByAppointment(appointmentId: number): Observable<MedicalEntryListApiResponse> {
    return this.http.get<MedicalEntryListApiResponse>(
      API_ROUTES.medicalRecords.byAppointment(appointmentId),
    );
  }

  updateClinical(
    patientId: number,
    body: UpdateClinicalRequest,
  ): Observable<MedicalRecordApiResponse> {
    return this.http.put<MedicalRecordApiResponse>(
      API_ROUTES.medicalRecords.clinical(patientId),
      body,
    );
  }
}
