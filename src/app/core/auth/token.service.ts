import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Role } from '@core/models/role.model';
import { UserMeResponse } from '@core/models/auth.model';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ROLES_KEY = 'roles';
const USER_KEY = 'user';
const EXPIRY_THRESHOLD_SECONDS = 60;

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getAccessToken(): string | null {
    return this.read(ACCESS_TOKEN_KEY);
  }

  isAccessTokenExpiringSoon(thresholdSeconds = EXPIRY_THRESHOLD_SECONDS): boolean {
    const expiresAt = this.getAccessTokenExpiry();
    if (expiresAt === null) return false;
    return expiresAt - Date.now() / 1000 <= thresholdSeconds;
  }

  private getAccessTokenExpiry(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const segment = token.split('.')[1];
    if (!segment) return null;
    try {
      const payload = JSON.parse(
        atob(segment.replace(/-/g, '+').replace(/_/g, '/')),
      ) as { exp?: number };
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    return this.read(REFRESH_TOKEN_KEY);
  }

  getRoles(): Role[] {
    return this.parse<Role[]>(ROLES_KEY) ?? [];
  }

  getUser(): UserMeResponse | null {
    return this.parse<UserMeResponse>(USER_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.write(ACCESS_TOKEN_KEY, accessToken);
    this.write(REFRESH_TOKEN_KEY, refreshToken);
  }

  setSession(roles: Role[], user: UserMeResponse): void {
    this.write(ROLES_KEY, JSON.stringify(roles));
    this.write(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    if (!this.isBrowser) return;
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ROLES_KEY, USER_KEY].forEach((key) =>
      localStorage.removeItem(key),
    );
  }

  private read(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  private write(key: string, value: string): void {
    if (this.isBrowser) localStorage.setItem(key, value);
  }

  private parse<T>(key: string): T | null {
    const raw = this.read(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
}
