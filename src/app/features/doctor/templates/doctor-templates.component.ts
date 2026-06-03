import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-templates',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="description"
      breadcrumb="médico / plantillas"
      title="Plantillas"
      subtitle="Plantillas personales del médico para acelerar la consulta: notas clínicas, diagnósticos y recetas frecuentes."
      [sections]="sections" />
  `,
})
export class DoctorTemplatesComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'note_add',
      title: 'Notas clínicas',
      description: 'Plantillas de evolución y examen físico reutilizables por motivo.',
    },
    {
      icon: 'diagnoses',
      title: 'Diagnósticos frecuentes',
      description: 'Conjuntos de diagnósticos habituales listos para aplicar.',
    },
    {
      icon: 'prescriptions',
      title: 'Recetas favoritas',
      description: 'Esquemas de medicación guardados para emitir recetas en un clic.',
    },
    {
      icon: 'edit',
      title: 'Gestión de plantillas',
      description: 'Crear, editar y organizar las plantillas personales del médico.',
    },
  ];
}
