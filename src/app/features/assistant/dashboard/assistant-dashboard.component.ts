import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-assistant-dashboard',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="assistant"
      icon="monitor_heart"
      breadcrumb="asistente / inicio"
      title="Estación de Triaje"
      subtitle="Resumen del día: pacientes derivados por recepción que esperan toma de signos antes de pasar a consulta."
      [sections]="sections" />
  `,
})
export class AssistantDashboardComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'pending_actions',
      title: 'Pendientes de triaje',
      description: 'Contador de pacientes que recepción derivó a triaje y aún no han sido atendidos.',
    },
    {
      icon: 'timer',
      title: 'Tiempo promedio de espera',
      description: 'Minutos promedio entre el registro de llegada y la toma de signos vitales.',
    },
    {
      icon: 'task_alt',
      title: 'Triajes completados hoy',
      description: 'Total de pacientes ya evaluados y derivados al médico durante la jornada.',
    },
    {
      icon: 'priority_high',
      title: 'Casos prioritarios',
      description: 'Pacientes marcados como urgentes según signos vitales fuera de rango.',
    },
    {
      icon: 'groups',
      title: 'Pacientes por médico',
      description: 'Distribución de los pacientes en triaje según el médico al que serán derivados.',
    },
    {
      icon: 'bolt',
      title: 'Acceso rápido',
      description: 'Atajo directo al siguiente paciente en la cola de triaje.',
    },
  ];
}
