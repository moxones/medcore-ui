import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { DoctorPatientsStore } from '@core/stores/doctor-patients.store';
import { DoctorPatientResponse } from '@core/models/doctor-workspace.model';

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressBarModule, AlertBannerComponent],
  templateUrl: './doctor-patients.component.html',
  styleUrl: './doctor-patients.component.scss',
})
export class DoctorPatientsComponent implements OnInit {
  readonly store = inject(DoctorPatientsStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => void this.store.setSearch(value));
    void this.store.load();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.search$.next('');
  }

  openHistory(patient: DoctorPatientResponse): void {
    void this.router.navigate(['/doctor/medical-records'], {
      queryParams: { patientId: patient.patientId },
    });
  }

  formatDate(iso: string | null): string {
    if (!iso) return 'Sin visitas';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  }

  formatNextAppointment(iso: string | null): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
}
