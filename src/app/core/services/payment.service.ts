import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '@core/api/api.config';
import {
  CreatePaymentRequest,
  PaymentApiResponse,
  PaymentListApiResponse,
} from '@core/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  create(appointmentId: number, body: CreatePaymentRequest): Observable<PaymentApiResponse> {
    return this.http.post<PaymentApiResponse>(
      API_ROUTES.appointments.payments(appointmentId),
      body,
    );
  }

  getByAppointment(appointmentId: number): Observable<PaymentListApiResponse> {
    return this.http.get<PaymentListApiResponse>(
      API_ROUTES.appointments.payments(appointmentId),
    );
  }
}
