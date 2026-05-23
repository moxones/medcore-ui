import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { ReceptionDashboardStore } from '@core/stores/reception-dashboard.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { AppointmentFlowStatus } from '@core/models/appointment.model';

interface QuickLink {
  icon: string;
  label: string;
  description: string;
  route: string;
  accentClass: string;
}

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatProgressBarModule, MatButtonModule, MatTooltipModule, KpiCardComponent],
  templateUrl: './reception-dashboard.component.html',
  styleUrl: './reception-dashboard.component.scss',
})
export class ReceptionDashboardComponent implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);
  readonly store = inject(ReceptionDashboardStore);

  readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  readonly greeting = this.buildGreeting();

  readonly quickLinks: QuickLink[] = [
    {
      icon: 'queue',
      label: 'Cola de Espera',
      description: 'Registrar llegada de pacientes',
      route: '/reception/queue',
      accentClass: 'accent-orange',
    },
    {
      icon: 'add_circle',
      label: 'Nueva Cita',
      description: 'Agendar por teléfono o presencial',
      route: '/reception/appointments/new',
      accentClass: 'accent-blue',
    },
    {
      icon: 'calendar_month',
      label: 'Agenda del Día',
      description: 'Ver timeline completo del día',
      route: '/reception/agenda',
      accentClass: 'accent-purple',
    },
    {
      icon: 'people',
      label: 'Pacientes',
      description: 'Buscar o registrar pacientes',
      route: '/reception/patients',
      accentClass: 'accent-green',
    },
  ];

  ngOnInit(): void {
    void this.store.loadToday();
  }

  onRefresh(): void {
    void this.store.refresh();
  }

  flowLabel(status: AppointmentFlowStatus): string {
    const labels: Record<AppointmentFlowStatus, string> = {
      WAITING: 'En espera',
      IN_PROCESS: 'En consulta',
      COMPLETED: 'Completada',
    };
    return labels[status];
  }

  flowClass(status: AppointmentFlowStatus): string {
    return status.toLowerCase().replace('_', '-');
  }

  formatTime(iso: string): string {
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  private buildGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
