import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-consultation',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="stethoscope"
      breadcrumb="médico / sala de consulta"
      title="Sala de Consulta"
      subtitle="Espacio de atención del paciente en curso: triaje, evolución, diagnóstico, recetas y órdenes en una sola pantalla."
      [sections]="sections" />
  `,
})
export class DoctorConsultationComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'person',
      title: 'Cabecera del paciente',
      description: 'Identidad, edad, alergias y antecedentes relevantes siempre visibles.',
    },
    {
      icon: 'monitor_heart',
      title: 'Signos del triaje',
      description: 'Signos vitales tomados por el asistente como punto de partida de la consulta.',
    },
    {
      icon: 'notes',
      title: 'Evolución y notas',
      description: 'Registro de la nota clínica: motivo, examen físico y plan de tratamiento.',
    },
    {
      icon: 'diagnoses',
      title: 'Diagnósticos',
      description: 'Selección de diagnósticos con codificación clínica y observaciones.',
    },
    {
      icon: 'prescriptions',
      title: 'Recetas y órdenes',
      description: 'Generación de recetas, exámenes de laboratorio e imágenes desde la consulta.',
    },
    {
      icon: 'check_circle',
      title: 'Finalizar atención',
      description: 'Cierre de la consulta que envía al paciente a cobranza o seguimiento.',
    },
  ];
}
