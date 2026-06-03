import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { from, switchMap } from 'rxjs';
import { TokenService } from '@core/auth/token.service';
import { AuthStore } from '@core/auth/auth.store';

const SKIP_AUTH_PATTERNS = ['/public/', '/auth/login', '/auth/refresh', '/auth/logout'];

function withBearer(req: Parameters<HttpInterceptorFn>[0], token: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return next(req);

  if (SKIP_AUTH_PATTERNS.some((pattern) => req.url.includes(pattern))) {
    return next(req);
  }

  const tokens = inject(TokenService);
  const accessToken = tokens.getAccessToken();
  if (!accessToken) return next(req);

  if (!tokens.isAccessTokenExpiringSoon()) {
    return next(withBearer(req, accessToken));
  }

  const authStore = inject(AuthStore);
  return from(authStore.refreshAccessToken()).pipe(
    switchMap((refreshedToken) => next(withBearer(req, refreshedToken ?? accessToken))),
  );
};
