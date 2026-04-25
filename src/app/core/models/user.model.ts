import { ApiResponse } from './api-response.model';

export interface PersonRequest {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  documentTypeCode: string;
  documentNumber: string;
}

export interface PersonResponse {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  person: PersonRequest;
  roleIds: number[];
}

export interface UpdateUserRequest {
  email: string;
  person: PersonRequest;
  roleIds: number[];
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  isActive: boolean;
  person: PersonResponse;
  roles: string[];
}

export type UserApiResponse = ApiResponse<UserResponse>;
export type UserListApiResponse = ApiResponse<UserResponse[]>;
