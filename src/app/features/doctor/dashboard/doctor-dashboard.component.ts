import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '@core/auth/auth.store';
import { TenantStore } from '@core/tenant/tenant.store';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss',
})
export class DoctorDashboardComponent {
  readonly authStore = inject(AuthStore);
  readonly tenantStore = inject(TenantStore);

  readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}
