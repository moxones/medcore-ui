import { ApiResponse } from './api-response.model';

export type AllergySeverity = 'BAJA' | 'MEDIA' | 'ALTA';
export type ConditionStatus = 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
export type FamilyRelationship =
  | 'PADRE'
  | 'MADRE'
  | 'HERMANO'
  | 'HERMANA'
  | 'ABUELO'
  | 'ABUELA'
  | 'HIJO'
  | 'HIJA'
  | 'OTRO';
export type HabitType = 'TABACO' | 'ALCOHOL' | 'DROGAS' | 'ACTIVIDAD_FISICA' | 'OTRO';
export type HabitStatus = 'ACTIVE' | 'FORMER' | 'NEVER';

export interface PatientAllergy {
  id: number;
  allergen: string;
  reaction: string | null;
  severity: AllergySeverity | null;
  isActive: boolean;
}

export interface PatientCondition {
  id: number;
  cie10Id: number | null;
  cie10Code: string | null;
  description: string;
  status: ConditionStatus;
  diagnosedAt: string | null;
}

export interface PatientFamilyHistory {
  id: number;
  relationship: FamilyRelationship;
  condition: string;
  notes: string | null;
}

export interface PatientSurgicalHistory {
  id: number;
  procedure: string;
  performedOn: string | null;
  notes: string | null;
}

export interface PatientHabit {
  id: number;
  habitType: HabitType;
  detail: string | null;
  status: HabitStatus;
}

export interface ClinicalHistory {
  patientId: number;
  bloodType: string | null;
  allergies: PatientAllergy[];
  conditions: PatientCondition[];
  familyHistory: PatientFamilyHistory[];
  surgicalHistory: PatientSurgicalHistory[];
  habits: PatientHabit[];
}

export interface CreateAllergyRequest {
  allergen: string;
  reaction?: string | null;
  severity?: AllergySeverity | null;
  isActive?: boolean;
}

export interface CreateConditionRequest {
  cie10Id?: number | null;
  description: string;
  status?: ConditionStatus;
  diagnosedAt?: string | null;
}

export interface CreateFamilyHistoryRequest {
  relationship: FamilyRelationship;
  condition: string;
  notes?: string | null;
}

export interface CreateSurgicalHistoryRequest {
  procedure: string;
  performedOn?: string | null;
  notes?: string | null;
}

export interface CreateHabitRequest {
  habitType: HabitType;
  detail?: string | null;
  status?: HabitStatus;
}

export type ClinicalHistoryApiResponse = ApiResponse<ClinicalHistory>;
export type AllergyApiResponse = ApiResponse<PatientAllergy>;
export type ConditionApiResponse = ApiResponse<PatientCondition>;
export type FamilyHistoryApiResponse = ApiResponse<PatientFamilyHistory>;
export type SurgicalHistoryApiResponse = ApiResponse<PatientSurgicalHistory>;
export type HabitApiResponse = ApiResponse<PatientHabit>;
export type ClinicalHistoryDeleteResponse = ApiResponse<null>;
