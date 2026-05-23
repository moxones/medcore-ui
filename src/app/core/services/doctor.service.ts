import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  BulkAssignBranchesRequest,
  CreateDoctorRequest,
  CreateDoctorScheduleRequest,
  DoctorApiResponse,
  DoctorBranchApiResponse,
  DoctorBranchListApiResponse,
  DoctorCardListApiResponse,
  DoctorListApiResponse,
  DoctorScheduleApiResponse,
  DoctorScheduleListApiResponse,
  DoctorListParams,
  DoctorScheduleListParams,
  UpdateDoctorScheduleRequest,
} from '@core/models/doctor.model';
import { ApiResponse } from '@core/models/api-response.model';
import { DoctorSpecialtyListApiResponse } from '@core/models/catalog.model';
import { PageRequest } from '@core/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);

  getList(filters: DoctorListParams = {}): Observable<DoctorListApiResponse> {
    const params = this.buildParams({ page: 0, size: 20, ...filters });
    return this.http.get<DoctorListApiResponse>(API_ROUTES.doctors.base, { params });
  }

  getCardList(filters: DoctorListParams = {}): Observable<DoctorCardListApiResponse> {
    const params = this.buildParams({ page: 0, size: 20, ...filters });
    return this.http.get<DoctorCardListApiResponse>(API_ROUTES.doctors.base, { params });
  }

  getById(id: number): Observable<DoctorApiResponse> {
    return this.http.get<DoctorApiResponse>(API_ROUTES.doctors.byId(id));
  }

  create(body: CreateDoctorRequest): Observable<DoctorApiResponse> {
    return this.http.post<DoctorApiResponse>(API_ROUTES.doctors.base, body);
  }

  getSpecialties(doctorId: number): Observable<DoctorSpecialtyListApiResponse> {
    return this.http.get<DoctorSpecialtyListApiResponse>(
      API_ROUTES.doctors.specialties(doctorId),
    );
  }

  getAvailableSpecialties(doctorId: number): Observable<DoctorSpecialtyListApiResponse> {
    return this.http.get<DoctorSpecialtyListApiResponse>(
      API_ROUTES.doctors.specialtiesAvailable(doctorId),
    );
  }

  assignSpecialty(doctorId: number, specialtyId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      API_ROUTES.doctors.specialtyLink(doctorId, specialtyId),
      {},
    );
  }

  removeSpecialty(doctorId: number, specialtyId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      API_ROUTES.doctors.specialtyLink(doctorId, specialtyId),
    );
  }

  bulkAssignSpecialties(
    doctorId: number,
    specialtyIds: number[],
  ): Observable<DoctorSpecialtyListApiResponse> {
    return this.http.post<DoctorSpecialtyListApiResponse>(
      API_ROUTES.doctors.specialtiesBulk(doctorId),
      { specialtyIds },
    );
  }

  replaceAllSpecialties(
    doctorId: number,
    specialtyIds: number[],
  ): Observable<DoctorSpecialtyListApiResponse> {
    return this.http.put<DoctorSpecialtyListApiResponse>(
      API_ROUTES.doctors.specialties(doctorId),
      { specialtyIds },
    );
  }

  getBranches(doctorId: number): Observable<DoctorBranchListApiResponse> {
    return this.http.get<DoctorBranchListApiResponse>(API_ROUTES.doctors.branches(doctorId));
  }

  assignBranch(doctorId: number, branchId: number): Observable<DoctorBranchApiResponse> {
    return this.http.post<DoctorBranchApiResponse>(
      API_ROUTES.doctors.branchLink(doctorId, branchId),
      null,
    );
  }

  bulkAssignBranches(
    doctorId: number,
    body: BulkAssignBranchesRequest,
  ): Observable<DoctorBranchListApiResponse> {
    return this.http.post<DoctorBranchListApiResponse>(
      API_ROUTES.doctors.branchesBulk(doctorId),
      body,
    );
  }

  removeBranch(doctorId: number, branchId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      API_ROUTES.doctors.branchLink(doctorId, branchId),
    );
  }

  getSchedules(
    doctorId: number,
    filters: DoctorScheduleListParams = {},
  ): Observable<DoctorScheduleListApiResponse> {
    const params = this.buildParams(filters);
    return this.http.get<DoctorScheduleListApiResponse>(API_ROUTES.doctors.schedules(doctorId), {
      params,
    });
  }

  createSchedule(
    doctorId: number,
    body: CreateDoctorScheduleRequest,
  ): Observable<DoctorScheduleApiResponse> {
    return this.http.post<DoctorScheduleApiResponse>(
      API_ROUTES.doctors.schedules(doctorId),
      body,
    );
  }

  updateSchedule(
    doctorId: number,
    scheduleId: number,
    body: UpdateDoctorScheduleRequest,
  ): Observable<DoctorScheduleApiResponse> {
    return this.http.put<DoctorScheduleApiResponse>(
      API_ROUTES.doctors.scheduleById(doctorId, scheduleId),
      body,
    );
  }

  deactivateSchedule(doctorId: number, scheduleId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      API_ROUTES.doctors.scheduleById(doctorId, scheduleId),
    );
  }

  updateLicense(id: number, licenseNumber: string): Observable<DoctorApiResponse> {
    return this.http.put<DoctorApiResponse>(API_ROUTES.doctors.byId(id), { licenseNumber });
  }

  deactivate(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API_ROUTES.doctors.byId(id));
  }

  private buildParams(filters: object): HttpParams {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== null)
      .reduce((params, [k, v]) => params.set(k, String(v)), new HttpParams());
  }
}
