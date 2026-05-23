import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, from, switchMap, throwError } from 'rxjs';
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
  const authStore = inject(AuthStore);

  const accessToken = tokens.getAccessToken();
  const authorizedReq = accessToken ? withBearer(req, accessToken) : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return from(authStore.refreshAccessToken()).pipe(
        switchMap((newToken) => {
          if (!newToken) {
            authStore.resetSession();
            return throwError(() => error);
          }
          return next(withBearer(req, newToken));
        }),
      );
    }),
  );
};
