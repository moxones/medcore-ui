import {
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { ChangePasswordDialogComponent } from '@shared/dialogs/change-password/change-password-dialog.component';
import { DoctorProfileStore } from '@core/stores/doctor-profile.store';
import { AuthStore } from '@core/auth/auth.store';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.scss',
})
export class DoctorProfileComponent implements OnInit {
  readonly store = inject(DoctorProfileStore);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  readonly stats = computed(() => {
    const p = this.store.profile();
    if (!p) return [];
    return [
      { icon: 'groups', label: 'Pacientes', value: p.totalPatients },
      { icon: 'event_available', label: 'Citas del mes', value: p.appointmentsThisMonth },
      { icon: 'task_alt', label: 'Consultas', value: p.consultationsCompleted },
      { icon: 'timer', label: 'Min/consulta', value: p.avgConsultationMinutes },
    ];
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.load();
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
    });
  }

  logout(): void {
    void this.authStore.logout();
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  }
}
