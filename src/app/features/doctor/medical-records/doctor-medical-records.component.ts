import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-medical-records',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="folder_open"
      breadcrumb="médico / historiales clínicos"
      title="Historiales Clínicos"
      subtitle="Acceso al historial clínico de los pacientes del médico: consultas previas, diagnósticos, recetas y adjuntos."
      [sections]="sections" />
  `,
})
export class DoctorMedicalRecordsComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'search',
      title: 'Buscar paciente',
      description: 'Localización del paciente por nombre o documento para abrir su historial.',
    },
    {
      icon: 'timeline',
      title: 'Línea de tiempo clínica',
      description: 'Cronología de consultas, diagnósticos y tratamientos del paciente.',
    },
    {
      icon: 'description',
      title: 'Detalle de consulta',
      description: 'Notas, signos y plan de cada atención registrada previamente.',
    },
    {
      icon: 'attach_file',
      title: 'Documentos adjuntos',
      description: 'Resultados de exámenes e imágenes asociados al historial.',
    },
  ];
}
