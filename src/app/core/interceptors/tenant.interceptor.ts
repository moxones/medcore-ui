import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from '../tenant/tenant.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const subdomain = inject(TenantService).getSubdomain();

  const updatedUrl = req.url.replace('localhost:8080', `${subdomain}.localhost:8080`);

  const cloned = req.clone({ url: updatedUrl });
  return next(cloned);
};
