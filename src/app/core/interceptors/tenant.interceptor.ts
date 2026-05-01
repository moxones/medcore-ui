import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from '../tenant/tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const subdomain = inject(TenantService).getSubdomain();

  if (!subdomain || subdomain === 'localhost') {
    return next(req);
  }

  const updatedUrl = req.url.replace('localhost:8080', `${subdomain}.localhost:8080`);
  return next(req.clone({ url: updatedUrl }));
};
