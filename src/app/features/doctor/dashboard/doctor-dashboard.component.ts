import { Component, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { TenantStore } from '@core/tenant/tenant.store';
import { AuthStore } from '@core/auth/auth.store';
import { DoctorDashboardStore } from '@core/stores/doctor-dashboard.store';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { DashboardHeroComponent } from '@shared/components/dashboard/dashboard-hero/dashboard-hero.component';
import { DashboardPanelComponent } from '@shared/components/dashboard/dashboard-panel/dashboard-panel.component';
import { QuickActionsComponent, QuickAction } from '@shared/components/dashboard/quick-actions/quick-actions.component';
import { AppointmentFlowStatus } from '@core/models/appointment.model';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    KpiCardComponent,
    DashboardHeroComponent,
    DashboardPanelComponent,
    QuickActionsComponent,
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss',
})
export class DoctorDashboardComponent implements OnInit {
  readonly tenantStore = inject(TenantStore);
  readonly authStore = inject(AuthStore);
  readonly store = inject(DoctorDashboardStore);

  readonly todayLabel = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  readonly greeting = this.buildGreeting();

  readonly doctorName = this.buildDoctorName();

  readonly quickLinks: QuickAction[] = [
    {
      icon: 'stethoscope',
      label: 'Sala de Consulta',
      description: 'Atender al paciente en turno',
      route: '/doctor/consultation',
      accent: 'blue',
    },
    {
      icon: 'event_available',
      label: 'Pacientes de Hoy',
      description: 'Tu agenda completa del día',
      route: '/doctor/today',
      accent: 'orange',
    },
    {
      icon: 'folder_open',
      label: 'Historiales',
      description: 'Consultar historias clínicas',
      route: '/doctor/medical-records',
      accent: 'purple',
    },
    {
      icon: 'prescriptions',
      label: 'Recetas',
      description: 'Emitir y revisar recetas',
      route: '/doctor/prescriptions',
      accent: 'green',
    },
    {
      icon: 'schedule',
      label: 'Mi Disponibilidad',
      description: 'Gestionar tus horarios',
      route: '/doctor/availability',
      accent: 'red',
    },
  ];

  ngOnInit(): void {
    void this.store.load();
  }

  onRefresh(): void {
    void this.store.refresh();
  }

  agendaSubtitle(): string {
    const total = this.store.summary()?.totalToday ?? 0;
    if (total === 0) return 'No tienes pacientes agendados para hoy';
    if (total === 1) return 'Tienes 1 paciente en tu agenda de hoy';
    return `Tienes ${total} pacientes en tu agenda de hoy`;
  }

  flowLabel(status: AppointmentFlowStatus): string {
    const labels: Record<AppointmentFlowStatus, string> = {
      SCHEDULED: 'Programada',
      WAITING: 'En espera',
      CALLED: 'Llamado',
      IN_PROCESS: 'En consulta',
      PENDING_PAYMENT: 'Por cobrar',
      COMPLETED: 'Atendida',
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

  formatRelativeDate(iso: string): string {
    return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(
      new Date(iso),
    );
  }

  private buildGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  private buildDoctorName(): string {
    const user = this.authStore.user();
    const last = user?.lastName ?? '';
    const first = user?.firstName ?? '';
    return `Dr. ${last || first}`.trim();
  }
}
