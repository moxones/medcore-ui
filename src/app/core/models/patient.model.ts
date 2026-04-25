export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  documentTypeCode: string;
  documentNumber: string;
}

export interface UpdateProfileRequest {
  phone: string;
  gender: string;
  birthDate: string;
  contactEmail: string;
}

export interface PatientResponse {
  id: number;
  firstName: string;
  lastName: string;
  contactEmail: string | null;
}
