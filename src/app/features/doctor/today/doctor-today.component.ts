import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { AuthStore } from '@core/auth/auth.store';
import { DoctorTodayStore, TodayFilter, TodayPatient, TodayVisualState } from '@core/stores/doctor-today.store';
import { UrgencyLevel } from '@core/models/triage.model';

interface FilterPill {
  id: TodayFilter;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-doctor-today',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressBarModule, AlertBannerComponent],
  templateUrl: './doctor-today.component.html',
  styleUrl: './doctor-today.component.scss',
})
export class DoctorTodayComponent implements OnInit {
  readonly store = inject(DoctorTodayStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');

  readonly filters: FilterPill[] = [
    { id: 'all', label: 'Todos', icon: 'groups' },
    { id: 'ready', label: 'En espera', icon: 'airline_seat_recline_normal' },
    { id: 'inConsult', label: 'En consulta', icon: 'medical_services' },
    { id: 'done', label: 'Atendidos', icon: 'task_alt' },
  ];

  readonly todayLabel = computed(() => {
    const d = new Date(this.store.currentTime());
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d);
    return `${weekday} ${day} de ${month}`;
  });

  readonly doctorName = computed(() => {
    const user = this.authStore.user();
    const last = user?.lastName ?? '';
    const first = user?.firstName ?? '';
    return `Dr. ${last || first}`.trim();
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.loadInit();
    interval(20_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.tick();
        void this.store.refresh();
      });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.store.setSearch(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.store.setSearch('');
  }

  setFilter(filter: TodayFilter): void {
    this.store.setFilter(filter);
  }

  onCall(patient: TodayPatient): void {
    void this.store.call(patient.id);
  }

  async onStart(patient: TodayPatient): Promise<void> {
    const ok = await this.store.startConsultation(patient.id);
    if (ok) {
      void this.router.navigate(['/doctor/consultation'], {
        queryParams: { appointmentId: patient.id },
      });
    }
  }

  canCall(patient: TodayPatient): boolean {
    return patient.visualState === 'scheduled' || patient.visualState === 'waiting';
  }

  canStart(patient: TodayPatient): boolean {
    return patient.visualState === 'waiting' || patient.visualState === 'called';
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  formatTime(iso: string): string {
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  stateLabel(state: TodayVisualState): string {
    const labels: Record<TodayVisualState, string> = {
      scheduled: 'Por llegar',
      waiting: 'En espera',
      called: 'Llamado',
      'in-process': 'En consulta',
      done: 'Atendido',
    };
    return labels[state];
  }

  urgencyLabel(urgency: UrgencyLevel): string {
    const labels: Record<UrgencyLevel, string> = {
      NORMAL: 'Normal',
      URGENT: 'Urgente',
      CRITICAL: 'Crítico',
    };
    return labels[urgency];
  }
}
