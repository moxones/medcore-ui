import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-triage-detail',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="assistant"
      icon="vital_signs"
      breadcrumb="asistente / cola de triaje / paciente"
      title="Triaje del Paciente"
      subtitle="Captura de signos vitales y motivo de consulta. Al finalizar, el paciente queda listo para que el médico lo atienda."
      [sections]="sections" />
  `,
})
export class TriageDetailComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'person',
      title: 'Cabecera del paciente',
      description: 'Identidad, edad, alergias conocidas y médico asignado visibles durante toda la toma.',
    },
    {
      icon: 'monitor_heart',
      title: 'Signos vitales',
      description: 'Presión arterial, frecuencia cardíaca, temperatura, saturación, frecuencia respiratoria.',
    },
    {
      icon: 'straighten',
      title: 'Antropometría',
      description: 'Peso, talla y cálculo automático de IMC con su clasificación.',
    },
    {
      icon: 'sick',
      title: 'Motivo de consulta',
      description: 'Síntoma principal, escala de dolor y notas rápidas del asistente.',
    },
    {
      icon: 'flag',
      title: 'Nivel de prioridad',
      description: 'Clasificación de urgencia sugerida según los signos fuera de rango.',
    },
    {
      icon: 'send',
      title: 'Enviar a consulta',
      description: 'Acción que guarda el triaje y deja al paciente disponible para el médico.',
    },
  ];
}
