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
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { DoctorPatientsStore } from '@core/stores/doctor-patients.store';
import { DoctorMedicalRecordsStore } from '@core/stores/doctor-medical-records.store';
import { MedicalEntryResponse } from '@core/models/medical-record.model';

@Component({
  selector: 'app-doctor-medical-records',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressBarModule, AlertBannerComponent],
  templateUrl: './doctor-medical-records.component.html',
  styleUrl: './doctor-medical-records.component.scss',
})
export class DoctorMedicalRecordsComponent implements OnInit {
  readonly patientsStore = inject(DoctorPatientsStore);
  readonly store = inject(DoctorMedicalRecordsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');
  readonly mobileShowDetail = signal(false);
  private readonly search$ = new Subject<string>();

  readonly selectedPatient = computed(() => {
    const id = this.store.selectedPatientId();
    return this.patientsStore.patients().find((p) => p.patientId === id) ?? null;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => void this.patientsStore.setSearch(value));

    void this.patientsStore.load();

    const preselect = Number(this.route.snapshot.queryParamMap.get('patientId'));
    if (preselect) {
      this.mobileShowDetail.set(true);
      void this.store.selectPatient(preselect);
    }
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

  selectPatient(patientId: number): void {
    this.mobileShowDetail.set(true);
    void this.store.selectPatient(patientId);
  }

  backToList(): void {
    this.mobileShowDetail.set(false);
  }

  toggleEntry(entry: MedicalEntryResponse): void {
    this.store.toggleEntry(entry.id);
  }

  isExpanded(entry: MedicalEntryResponse): boolean {
    return this.store.expandedEntryId() === entry.id;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  }

  formatTime(iso: string | null): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  entryTitle(entry: MedicalEntryResponse): string {
    return entry.diagnosis || entry.chiefComplaint || entry.assessment || 'Consulta';
  }
}
