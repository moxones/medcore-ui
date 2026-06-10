import { Injectable, inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantInfoResponse } from '../models/tenant.model';
import { API_ROUTES } from '../api/api.config';
import { environment } from '../../../environments/environment';

const NON_TENANT_SUBDOMAINS = new Set(['www', 'api']);

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });

  resolve(): Observable<TenantInfoResponse> {
    return this.http.get<TenantInfoResponse>(API_ROUTES.tenant.info);
  }

  getSubdomain(): string {
    const hostname = this.currentHostname();
    const baseHostname = new URL(environment.apiUrl).hostname;
    if (!hostname.endsWith(`.${baseHostname}`)) return '';
    const subdomain = hostname.slice(0, -(baseHostname.length + 1));
    if (!subdomain || subdomain.includes('.') || NON_TENANT_SUBDOMAINS.has(subdomain)) return '';
    return subdomain;
  }

  private currentHostname(): string {
    if (isPlatformBrowser(this.platformId)) return window.location.hostname;
    if (!this.request) return '';
    return new URL(this.request.url).hostname;
  }
}
