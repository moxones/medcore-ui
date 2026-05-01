import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserApiResponse,
  UserListApiResponse,
} from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getList(): Observable<UserListApiResponse> {
    return this.http.get<UserListApiResponse>(API_ROUTES.users.base);
  }

  getById(id: number): Observable<UserApiResponse> {
    return this.http.get<UserApiResponse>(API_ROUTES.users.byId(id));
  }

  create(body: CreateUserRequest): Observable<UserApiResponse> {
    return this.http.post<UserApiResponse>(API_ROUTES.users.base, body);
  }

  update(id: number, body: UpdateUserRequest): Observable<UserApiResponse> {
    return this.http.put<UserApiResponse>(API_ROUTES.users.byId(id), body);
  }

  updateStatus(id: number, body: UpdateUserStatusRequest): Observable<UserApiResponse> {
    return this.http.patch<UserApiResponse>(API_ROUTES.users.status(id), body);
  }
}
