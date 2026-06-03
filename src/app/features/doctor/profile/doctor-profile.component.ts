import { Component } from '@angular/core';
import {
  PlaceholderSection,
  SectionPlaceholderComponent,
} from '@shared/components/section-placeholder/section-placeholder.component';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [SectionPlaceholderComponent],
  template: `
    <app-section-placeholder
      accent="doctor"
      icon="badge"
      breadcrumb="médico / mi perfil"
      title="Mi Perfil"
      subtitle="Datos profesionales del médico: especialidades, colegiatura, sucursales y preferencias de su cuenta."
      [sections]="sections" />
  `,
})
export class DoctorProfileComponent {
  readonly sections: PlaceholderSection[] = [
    {
      icon: 'person',
      title: 'Datos personales',
      description: 'Nombre, contacto y foto del profesional.',
    },
    {
      icon: 'workspace_premium',
      title: 'Datos profesionales',
      description: 'Especialidades, número de colegiatura y sucursales asignadas.',
    },
    {
      icon: 'tune',
      title: 'Preferencias',
      description: 'Ajustes de consulta como duración por defecto y plantillas activas.',
    },
    {
      icon: 'lock',
      title: 'Seguridad',
      description: 'Cambio de contraseña y gestión de la sesión.',
    },
  ];
}
