import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-triage-history',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="assistant"
      icon="fact_check"
      breadcrumb="asistente / triajes de hoy"
      title="Triajes de Hoy"
      subtitle="Registro de los pacientes ya evaluados durante la jornada, con sus signos vitales y a qué médico fueron derivados."
      [sections]="sections" />
  `,
})
export class TriageHistoryComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'list_alt',
      title: 'Listado de triajes',
      description: 'Tarjetas de pacientes ya evaluados con hora del triaje y médico de destino.',
    },
    {
      icon: 'monitor_heart',
      title: 'Resumen de signos',
      description: 'Vista compacta de los signos vitales registrados en cada triaje.',
    },
    {
      icon: 'visibility',
      title: 'Ver detalle',
      description: 'Acción para revisar la toma completa de un paciente sin poder editarla.',
    },
    {
      icon: 'filter_list',
      title: 'Filtros',
      description: 'Filtrado por médico, prioridad o rango de hora dentro del día.',
    },
  ];
}
