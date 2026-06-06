import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { Cie10PageApiResponse, Cie10SearchParams } from '@core/models/cie10.model';

@Injectable({ providedIn: 'root' })
export class Cie10Service {
  private readonly http = inject(HttpClient);

  search(params: Cie10SearchParams = {}): Observable<Cie10PageApiResponse> {
    return this.http.get<Cie10PageApiResponse>(API_ROUTES.cie10.base, {
      params: this.buildParams(params),
    });
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }
}
