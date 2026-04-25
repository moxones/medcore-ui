import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { TenantInfoResponse } from '../models/tenant.model';
import { API_ROUTES } from '../api/api.config';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  resolve(): Observable<TenantInfoResponse> {
    return this.http.get<TenantInfoResponse>(API_ROUTES.tenant.info);
  }

  getSubdomain(): string {
    if (!isPlatformBrowser(this.platformId)) return 'healthcare';
    return window.location.hostname.split('.')[0];
  }
}
