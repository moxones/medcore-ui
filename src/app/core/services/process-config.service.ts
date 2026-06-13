import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  ProcessConfigApiResponse,
  UpdateProcessConfigRequest,
} from '@core/models/process-config.model';

@Injectable({ providedIn: 'root' })
export class ProcessConfigService {
  private readonly http = inject(HttpClient);

  get(): Observable<ProcessConfigApiResponse> {
    return this.http.get<ProcessConfigApiResponse>(API_ROUTES.processConfig.base);
  }

  update(body: UpdateProcessConfigRequest): Observable<ProcessConfigApiResponse> {
    return this.http.put<ProcessConfigApiResponse>(API_ROUTES.processConfig.base, body);
  }
}
