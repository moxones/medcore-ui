import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-today',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="event_available"
      breadcrumb="médico / pacientes de hoy"
      title="Mis Pacientes de Hoy"
      subtitle="Cola de atención del médico: pacientes con triaje listo o en espera, ordenados para pasar a consulta uno a uno."
      [sections]="sections" />
  `,
})
export class DoctorTodayComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'queue',
      title: 'Cola de atención',
      description: 'Pacientes listos para ser atendidos, con triaje ya tomado por el asistente.',
    },
    {
      icon: 'monitor_heart',
      title: 'Resumen de triaje',
      description: 'Signos vitales y motivo de consulta visibles antes de llamar al paciente.',
    },
    {
      icon: 'campaign',
      title: 'Llamar paciente',
      description: 'Acción para llamar al siguiente paciente y marcar el inicio de la consulta.',
    },
    {
      icon: 'play_circle',
      title: 'Iniciar consulta',
      description: 'Atajo directo a la sala de consulta con el paciente seleccionado.',
    },
    {
      icon: 'schedule',
      title: 'Tiempos de espera',
      description: 'Indicador de cuánto lleva esperando cada paciente tras el triaje.',
    },
    {
      icon: 'task_alt',
      title: 'Atendidos hoy',
      description: 'Contador de consultas completadas durante la jornada.',
    },
  ];
}
