import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  AllergyApiResponse,
  ClinicalHistoryApiResponse,
  ClinicalHistoryDeleteResponse,
  ConditionApiResponse,
  CreateAllergyRequest,
  CreateConditionRequest,
  CreateFamilyHistoryRequest,
  CreateHabitRequest,
  CreateSurgicalHistoryRequest,
  FamilyHistoryApiResponse,
  HabitApiResponse,
  SurgicalHistoryApiResponse,
} from '@core/models/clinical-history.model';

@Injectable({ providedIn: 'root' })
export class ClinicalHistoryService {
  private readonly http = inject(HttpClient);

  getHistory(patientId: number): Observable<ClinicalHistoryApiResponse> {
    return this.http.get<ClinicalHistoryApiResponse>(API_ROUTES.patients.clinicalHistory(patientId));
  }

  addAllergy(patientId: number, body: CreateAllergyRequest): Observable<AllergyApiResponse> {
    return this.http.post<AllergyApiResponse>(API_ROUTES.patients.allergies(patientId), body);
  }

  deleteAllergy(patientId: number, itemId: number): Observable<ClinicalHistoryDeleteResponse> {
    return this.http.delete<ClinicalHistoryDeleteResponse>(
      API_ROUTES.patients.allergyById(patientId, itemId),
    );
  }

  addCondition(patientId: number, body: CreateConditionRequest): Observable<ConditionApiResponse> {
    return this.http.post<ConditionApiResponse>(API_ROUTES.patients.conditions(patientId), body);
  }

  deleteCondition(patientId: number, itemId: number): Observable<ClinicalHistoryDeleteResponse> {
    return this.http.delete<ClinicalHistoryDeleteResponse>(
      API_ROUTES.patients.conditionById(patientId, itemId),
    );
  }

  addFamilyHistory(
    patientId: number,
    body: CreateFamilyHistoryRequest,
  ): Observable<FamilyHistoryApiResponse> {
    return this.http.post<FamilyHistoryApiResponse>(
      API_ROUTES.patients.familyHistory(patientId),
      body,
    );
  }

  deleteFamilyHistory(patientId: number, itemId: number): Observable<ClinicalHistoryDeleteResponse> {
    return this.http.delete<ClinicalHistoryDeleteResponse>(
      API_ROUTES.patients.familyHistoryById(patientId, itemId),
    );
  }

  addSurgicalHistory(
    patientId: number,
    body: CreateSurgicalHistoryRequest,
  ): Observable<SurgicalHistoryApiResponse> {
    return this.http.post<SurgicalHistoryApiResponse>(
      API_ROUTES.patients.surgicalHistory(patientId),
      body,
    );
  }

  deleteSurgicalHistory(
    patientId: number,
    itemId: number,
  ): Observable<ClinicalHistoryDeleteResponse> {
    return this.http.delete<ClinicalHistoryDeleteResponse>(
      API_ROUTES.patients.surgicalHistoryById(patientId, itemId),
    );
  }

  addHabit(patientId: number, body: CreateHabitRequest): Observable<HabitApiResponse> {
    return this.http.post<HabitApiResponse>(API_ROUTES.patients.habits(patientId), body);
  }

  deleteHabit(patientId: number, itemId: number): Observable<ClinicalHistoryDeleteResponse> {
    return this.http.delete<ClinicalHistoryDeleteResponse>(
      API_ROUTES.patients.habitById(patientId, itemId),
    );
  }
}
