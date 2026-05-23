import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';

const SKIP_REFRESH_PATTERNS = ['/public/', '/auth/login', '/auth/refresh', '/auth/logout'];
const ALREADY_RETRIED = new HttpContextToken<boolean>(() => false);

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return next(req);
  if (SKIP_REFRESH_PATTERNS.some((pattern) => req.url.includes(pattern))) {
    return next(req);
  }

  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isAuthError =
        error instanceof HttpErrorResponse && error.status === 401;

      if (!isAuthError || req.context.get(ALREADY_RETRIED)) {
        return throwError(() => error);
      }

      return from(authStore.refreshAccessToken()).pipe(
        switchMap((token) => {
          if (!token) {
            authStore.resetSession();
            return throwError(() => error);
          }

          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
              context: req.context.set(ALREADY_RETRIED, true),
            }),
          );
        }),
      );
    }),
  );
};
