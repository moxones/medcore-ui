import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-assistant-patients',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="assistant"
      icon="people"
      breadcrumb="asistente / pacientes"
      title="Pacientes"
      subtitle="Directorio de pacientes para consultar datos básicos, contacto y alergias antes o durante el triaje."
      [sections]="sections" />
  `,
})
export class AssistantPatientsComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'grid_view',
      title: 'Directorio en tarjetas',
      description: 'Grid de pacientes con avatar, nombre, documento y datos de contacto.',
    },
    {
      icon: 'search',
      title: 'Búsqueda',
      description: 'Buscador por nombre o documento para ubicar rápido a un paciente.',
    },
    {
      icon: 'medical_information',
      title: 'Datos clínicos básicos',
      description: 'Alergias, tipo de sangre y antecedentes relevantes para el triaje.',
    },
    {
      icon: 'history',
      title: 'Últimos triajes',
      description: 'Resumen de las tomas de signos previas del paciente seleccionado.',
    },
  ];
}
