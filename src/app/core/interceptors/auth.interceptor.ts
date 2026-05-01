import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const SKIP_AUTH_PATTERNS = ['/public/', '/auth/login'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) return next(req);

  if (SKIP_AUTH_PATTERNS.some((pattern) => req.url.includes(pattern))) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
