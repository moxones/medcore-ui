import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { UserMeResponse, AuthResponse, RegisterRequest, RefreshRequest } from '@core/models/auth.model';
import { ApiResponse } from '@core/models/api-response.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ROUTES.auth.login, credentials);
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ROUTES.auth.register, body);
  }

  refresh(body: RefreshRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ROUTES.auth.refresh, body);
  }

  me(): Observable<UserMeResponse> {
    return this.http.get<UserMeResponse>(API_ROUTES.auth.me);
  }

  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(API_ROUTES.auth.logout, { refreshToken });
  }

  changePassword(body: ChangePasswordRequest): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(API_ROUTES.profile.password, body);
  }
}
