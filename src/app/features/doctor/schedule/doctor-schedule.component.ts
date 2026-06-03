import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="event_note"
      breadcrumb="médico / agenda"
      title="Mi Agenda"
      subtitle="Calendario de citas del médico por día, semana y mes, con el detalle de cada cita programada."
      [sections]="sections" />
  `,
})
export class DoctorScheduleComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'calendar_month',
      title: 'Vista de calendario',
      description: 'Citas en vistas de día, semana y mes con cambio rápido de rango.',
    },
    {
      icon: 'event',
      title: 'Detalle de cita',
      description: 'Paciente, hora, tipo de consulta y estado al seleccionar una cita.',
    },
    {
      icon: 'block',
      title: 'Bloqueos y descansos',
      description: 'Franjas no disponibles del médico reflejadas sobre el calendario.',
    },
    {
      icon: 'filter_list',
      title: 'Filtros',
      description: 'Filtrado por sucursal, tipo de cita o estado de la agenda.',
    },
  ];
}
