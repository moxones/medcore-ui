import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { ReceptionDashboardStore } from '@core/stores/reception-dashboard.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { DashboardHeroComponent } from '@shared/components/dashboard/dashboard-hero/dashboard-hero.component';
import { DashboardPanelComponent } from '@shared/components/dashboard/dashboard-panel/dashboard-panel.component';
import { QuickActionsComponent, QuickAction } from '@shared/components/dashboard/quick-actions/quick-actions.component';
import { AppointmentFlowStatus } from '@core/models/appointment.model';

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTooltipModule,
    KpiCardComponent,
    DashboardHeroComponent,
    DashboardPanelComponent,
    QuickActionsComponent,
  ],
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

  readonly quickLinks: QuickAction[] = [
    {
      icon: 'queue',
      label: 'Cola de Espera',
      description: 'Registrar llegada de pacientes',
      route: '/reception/queue',
      accent: 'orange',
    },
    {
      icon: 'add_circle',
      label: 'Nueva Cita',
      description: 'Agendar por teléfono o presencial',
      route: '/reception/appointments/new',
      accent: 'blue',
    },
    {
      icon: 'calendar_month',
      label: 'Agenda del Día',
      description: 'Ver timeline completo del día',
      route: '/reception/agenda',
      accent: 'purple',
    },
    {
      icon: 'people',
      label: 'Pacientes',
      description: 'Buscar o registrar pacientes',
      route: '/reception/patients',
      accent: 'green',
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
      SCHEDULED: 'Programada',
      WAITING: 'En espera',
      CALLED: 'Llamado',
      IN_PROCESS: 'En consulta',
      PENDING_PAYMENT: 'Por cobrar',
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
