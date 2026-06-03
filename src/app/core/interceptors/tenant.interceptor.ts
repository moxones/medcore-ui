import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from '../tenant/tenant.service';
import { environment } from '../../../environments/environment';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const subdomain = inject(TenantService).getSubdomain();

  if (!subdomain || subdomain === 'localhost') {
    return next(req);
  }

  const apiHost = new URL(environment.apiUrl).host;
  const updatedUrl = req.url.replace(apiHost, `${subdomain}.${apiHost}`);
  return next(req.clone({ url: updatedUrl }));
};
