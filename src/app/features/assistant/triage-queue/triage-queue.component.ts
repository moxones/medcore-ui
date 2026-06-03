import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-triage-queue',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="assistant"
      icon="pending_actions"
      breadcrumb="asistente / cola de triaje"
      title="Cola de Triaje"
      subtitle="Pacientes que recepción registró y derivó a triaje. Desde aquí el asistente toma signos vitales y los pasa a consulta."
      [sections]="sections" />
  `,
})
export class TriageQueueComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'view_agenda',
      title: 'Lista de espera de triaje',
      description: 'Tarjetas de pacientes derivados, ordenadas por tiempo de espera, con avatar y datos clave.',
    },
    {
      icon: 'schedule',
      title: 'Tiempo en espera',
      description: 'Indicador del tiempo transcurrido desde la derivación, resaltando los que llevan demasiado.',
    },
    {
      icon: 'badge',
      title: 'Datos del paciente',
      description: 'Nombre, documento, edad, médico asignado y motivo de la cita en cada tarjeta.',
    },
    {
      icon: 'play_circle',
      title: 'Iniciar triaje',
      description: 'Acción para abrir el formulario de signos vitales del paciente seleccionado.',
    },
    {
      icon: 'search',
      title: 'Búsqueda y filtros',
      description: 'Buscador por nombre o documento y filtros por médico o nivel de prioridad.',
    },
    {
      icon: 'inbox',
      title: 'Estado vacío',
      description: 'Mensaje amable cuando no hay pacientes pendientes de triaje en el momento.',
    },
  ];
}
