import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  BranchApiResponse,
  BranchListApiResponse,
  CreateBranchRequest,
} from '@core/models/branch.model';
import { PageRequest } from '@core/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly http = inject(HttpClient);

  getList(pagination: PageRequest = {}): Observable<BranchListApiResponse> {
    const params = new HttpParams()
      .set('page', pagination.page ?? 0)
      .set('size', pagination.size ?? 20);
    return this.http.get<BranchListApiResponse>(API_ROUTES.branches.base, { params });
  }

  getById(id: number): Observable<BranchApiResponse> {
    return this.http.get<BranchApiResponse>(API_ROUTES.branches.byId(id));
  }

  create(body: CreateBranchRequest): Observable<BranchApiResponse> {
    return this.http.post<BranchApiResponse>(API_ROUTES.branches.base, body);
  }
}
