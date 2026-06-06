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

export interface DocumentTypeResponse {
  id: number;
  code: string;
  name: string;
}

export interface DocumentResponse {
  id: number;
  documentType: DocumentTypeResponse;
  documentNumber: string;
}

export interface PersonResponse {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  contactEmail: string;
  profileCompleted: boolean;
  documents: DocumentResponse[];
}

export interface RoleResponse {
  id: number;
  name: string;
  code: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  person: PersonRequest;
  roleIds: number[];
  roles: string[];
}

export interface CreateSuperAdminUserRequest extends CreateUserRequest {
  tenantId: number;
}

export interface UpdateUserRequest {
  email: string;
  person: PersonRequest;
  roles: string[];
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface SetPasswordRequest {
  newPassword: string;
}

export interface AssignRolesRequest {
  roleIds: number[];
}

export interface UserResponse {
  id: number;
  email: string;
  isActive: boolean;
  tenantId: number;
  person: PersonResponse;
  roles: RoleResponse[];
  createdAt: string;
}

export type UserApiResponse = ApiResponse<UserResponse>;
export type UserListApiResponse = ApiResponse<UserResponse[]>;

export interface SuperAdminPersonResponse {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: string | null;
  phone: string | null;
  documentTypeCode: string | null;
  documentNumber: string | null;
}

export interface SuperAdminUserResponse {
  id: number;
  email: string;
  isActive: boolean;
  tenantId: number;
  person: SuperAdminPersonResponse;
  roles: string[];
  roleIds: number[];
}

export type SuperAdminUserListApiResponse = ApiResponse<SuperAdminUserResponse[]>;

export interface UserBranchResponse {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  branchId: number;
  branchName: string;
  branchAddress: string;
  isActive: boolean;
  createdAt: string;
}

export type UserBranchApiResponse = ApiResponse<UserBranchResponse>;
export type UserBranchListApiResponse = ApiResponse<UserBranchResponse[]>;

export interface StaffBranchRow {
  user: UserResponse;
  branches: UserBranchResponse[];
}
