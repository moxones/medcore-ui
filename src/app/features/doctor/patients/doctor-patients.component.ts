import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="people"
      breadcrumb="médico / pacientes"
      title="Mis Pacientes"
      subtitle="Directorio de los pacientes que atiende el médico, con acceso rápido a su historial y próxima cita."
      [sections]="sections" />
  `,
})
export class DoctorPatientsComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'grid_view',
      title: 'Directorio en tarjetas',
      description: 'Grid de pacientes con avatar, datos de contacto y última visita.',
    },
    {
      icon: 'search',
      title: 'Búsqueda y filtros',
      description: 'Buscador por nombre o documento y filtros por estado o frecuencia.',
    },
    {
      icon: 'folder_shared',
      title: 'Abrir historial',
      description: 'Acceso directo al historial clínico del paciente seleccionado.',
    },
    {
      icon: 'event_upcoming',
      title: 'Próxima cita',
      description: 'Indicador de la próxima cita programada con cada paciente.',
    },
  ];
}
