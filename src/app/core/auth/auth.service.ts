import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ROUTES } from '@core/api/api.config';
import { UserMeResponse } from '@core/models/auth.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tenant: {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials);
  }

  me(): Observable<UserMeResponse> {
    return this.http.get<UserMeResponse>(API_ROUTES.auth.me);
  }

  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(API_ROUTES.auth.logout, { refreshToken });
  }
}
