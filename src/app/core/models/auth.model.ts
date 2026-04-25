export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  documentTypeCode: string;
  documentNumber: string;
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserMeResponse {
  userId: number;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
  tenantId: number;
}
