import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ROUTES } from '@core/api/api.config';
import { normalizeRole } from '@core/models/role.model';
import {
  CreateUserRequest,
  CreateSuperAdminUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  SetPasswordRequest,
  AssignRolesRequest,
  UserApiResponse,
  UserListApiResponse,
  UserResponse,
  SuperAdminUserResponse,
  SuperAdminUserListApiResponse,
} from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  private normalizeUser(u: SuperAdminUserResponse): UserResponse {
    return {
      id: u.id,
      email: u.email,
      isActive: u.isActive,
      tenantId: u.tenantId,
      createdAt: '',
      person: {
        id: 0,
        firstName: u.person.firstName,
        lastName: u.person.lastName,
        birthDate: u.person.birthDate ?? '',
        gender: u.person.gender ?? '',
        phone: u.person.phone ?? '',
        contactEmail: '',
        profileCompleted: false,
        documents:
          u.person.documentNumber && u.person.documentTypeCode
            ? [
                {
                  id: 0,
                  documentType: {
                    id: 0,
                    code: u.person.documentTypeCode,
                    name: u.person.documentTypeCode,
                  },
                  documentNumber: u.person.documentNumber,
                },
              ]
            : [],
      },
      roles: u.roles.map((code, idx) => {
        const canonical = normalizeRole(code) ?? code;
        return { id: u.roleIds[idx] ?? 0, code: canonical, name: canonical };
      }),
    };
  }

  getList(): Observable<UserListApiResponse> {
    return this.http
      .get<SuperAdminUserListApiResponse>(API_ROUTES.users.base)
      .pipe(map((res) => ({ ...res, data: res.data.map((u) => this.normalizeUser(u)) })));
  }

  getListForSuperAdmin(): Observable<UserListApiResponse> {
    return this.http
      .get<SuperAdminUserListApiResponse>(API_ROUTES.superAdmin.users)
      .pipe(map((res) => ({ ...res, data: res.data.map((u) => this.normalizeUser(u)) })));
  }

  getById(id: number): Observable<UserApiResponse> {
    return this.http.get<UserApiResponse>(API_ROUTES.users.byId(id));
  }

  create(body: CreateUserRequest): Observable<UserApiResponse> {
    return this.http.post<UserApiResponse>(API_ROUTES.users.base, body);
  }

  createForTenant(body: CreateSuperAdminUserRequest): Observable<UserApiResponse> {
    return this.http.post<UserApiResponse>(API_ROUTES.superAdmin.users, body);
  }

  update(id: number, body: UpdateUserRequest): Observable<UserApiResponse> {
    return this.http.put<UserApiResponse>(API_ROUTES.users.byId(id), body);
  }

  updateForSuperAdmin(id: number, body: UpdateUserRequest): Observable<UserApiResponse> {
    return this.http.put<UserApiResponse>(API_ROUTES.superAdmin.userById(id), body);
  }

  updateStatus(id: number, body: UpdateUserStatusRequest): Observable<UserApiResponse> {
    return this.http.patch<UserApiResponse>(API_ROUTES.users.status(id), body);
  }

  assignRoles(id: number, body: AssignRolesRequest): Observable<UserApiResponse> {
    return this.http.post<UserApiResponse>(API_ROUTES.users.roles(id), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(API_ROUTES.users.byId(id));
  }

  setUserPassword(id: number, body: SetPasswordRequest): Observable<void> {
    return this.http.put<void>(API_ROUTES.superAdmin.userPassword(id), body);
  }
}
