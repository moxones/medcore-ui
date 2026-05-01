import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import { BookingApiResponse, CreateBookingRequest } from '@core/models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  create(body: CreateBookingRequest): Observable<BookingApiResponse> {
    return this.http.post<BookingApiResponse>(API_ROUTES.public.booking, body);
  }
}
