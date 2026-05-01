import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { ApiResponse } from '@core/models/api-response.model';
import {
  CreateSubscriptionRequest,
  SubscriptionApiResponse,
  SubscriptionListApiResponse,
  UpdateSubscriptionRequest,
} from '@core/models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);

  getList(): Observable<SubscriptionListApiResponse> {
    return this.http.get<SubscriptionListApiResponse>(API_ROUTES.subscriptions.base);
  }

  getById(id: number): Observable<SubscriptionApiResponse> {
    return this.http.get<SubscriptionApiResponse>(API_ROUTES.subscriptions.byId(id));
  }

  create(body: CreateSubscriptionRequest): Observable<SubscriptionApiResponse> {
    return this.http.post<SubscriptionApiResponse>(API_ROUTES.subscriptions.base, body);
  }

  update(id: number, body: UpdateSubscriptionRequest): Observable<SubscriptionApiResponse> {
    return this.http.put<SubscriptionApiResponse>(API_ROUTES.subscriptions.byId(id), body);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.subscriptions.byId(id));
  }
}
