import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-prescriptions',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="prescriptions"
      breadcrumb="médico / recetas"
      title="Recetas"
      subtitle="Recetas emitidas por el médico, con búsqueda, reimpresión y plantillas de medicación frecuente."
      [sections]="sections" />
  `,
})
export class DoctorPrescriptionsComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'receipt_long',
      title: 'Recetas emitidas',
      description: 'Listado de recetas por paciente y fecha con su estado.',
    },
    {
      icon: 'medication',
      title: 'Medicamentos',
      description: 'Detalle de fármacos, dosis, frecuencia y duración de cada receta.',
    },
    {
      icon: 'bookmark',
      title: 'Plantillas frecuentes',
      description: 'Conjuntos de medicación habitual para emitir recetas más rápido.',
    },
    {
      icon: 'print',
      title: 'Imprimir / reenviar',
      description: 'Reimpresión o envío de la receta al paciente.',
    },
  ];
}
