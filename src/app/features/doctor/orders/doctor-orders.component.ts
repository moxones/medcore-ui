import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-orders',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="science"
      breadcrumb="médico / órdenes y exámenes"
      title="Órdenes y Exámenes"
      subtitle="Solicitudes de laboratorio e imágenes emitidas por el médico y seguimiento de sus resultados."
      [sections]="sections" />
  `,
})
export class DoctorOrdersComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'assignment',
      title: 'Órdenes emitidas',
      description: 'Listado de solicitudes de exámenes por paciente y estado.',
    },
    {
      icon: 'biotech',
      title: 'Catálogo de exámenes',
      description: 'Selección de pruebas de laboratorio e imágenes a solicitar.',
    },
    {
      icon: 'pending',
      title: 'Resultados pendientes',
      description: 'Seguimiento de las órdenes que aún esperan resultado.',
    },
    {
      icon: 'fact_check',
      title: 'Resultados recibidos',
      description: 'Revisión de resultados ya cargados y su asociación al historial.',
    },
  ];
}
