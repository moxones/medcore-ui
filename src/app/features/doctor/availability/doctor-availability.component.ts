import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="schedule"
      breadcrumb="médico / mi disponibilidad"
      title="Mi Disponibilidad"
      subtitle="Autogestión de horarios: el médico define sus franjas de atención, duración de cita y bloqueos por sucursal."
      [sections]="sections" />
  `,
})
export class DoctorAvailabilityComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'calendar_view_week',
      title: 'Horario semanal',
      description: 'Definición de los días y horas de atención por sucursal.',
    },
    {
      icon: 'timelapse',
      title: 'Duración de cita',
      description: 'Configuración del tiempo por consulta y cupos disponibles.',
    },
    {
      icon: 'event_busy',
      title: 'Bloqueos y ausencias',
      description: 'Registro de vacaciones, permisos o franjas no disponibles.',
    },
    {
      icon: 'repeat',
      title: 'Plantillas de horario',
      description: 'Reutilización de horarios habituales para aplicarlos rápidamente.',
    },
  ];
}
