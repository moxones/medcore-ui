import { Component, OnInit, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PatientStore } from '@core/stores/patient.store';
import { PatientDossierStore } from '@core/stores/patient-dossier.store';
import { PatientResponse } from '@core/models/patient.model';
import { TriageSummaryResponse, UrgencyLevel } from '@core/models/triage.model';
import { computeImc, urgencyKey, urgencyLabel } from '@core/utils/triage-vitals.util';

@Component({
  selector: 'app-assistant-patients',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatTooltipModule, MatProgressBarModule],
  templateUrl: './assistant-patients.component.html',
  styleUrl: './assistant-patients.component.scss',
})
export class AssistantPatientsComponent implements OnInit {
  readonly store = inject(PatientStore);
  readonly dossier = inject(PatientDossierStore);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly patients = computed(() => this.store.page()?.content ?? []);
  readonly totalElements = computed(() => this.store.page()?.totalElements ?? 0);
  readonly pageNumber = computed(() => this.store.page()?.pageNumber ?? 0);
  readonly totalPages = computed(() => this.store.page()?.totalPages ?? 0);
  readonly isLast = computed(() => this.store.page()?.last ?? true);

  readonly allergyList = computed(() => this.splitClinical(this.dossier.record()?.allergies ?? null));
  readonly conditionList = computed(() => this.splitClinical(this.dossier.record()?.chronicConditions ?? null));

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        const trimmed = query.trim();
        if (trimmed.length >= 2) {
          void this.store.search(trimmed);
        } else if (trimmed === '') {
          void this.store.load({ page: 0 });
        }
      });
  }

  ngOnInit(): void {
    void this.store.load({ page: 0 });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  onPage(direction: 'prev' | 'next'): void {
    const next = direction === 'next' ? this.pageNumber() + 1 : this.pageNumber() - 1;
    void this.store.load({ page: next });
  }

  openDossier(patient: PatientResponse): void {
    void this.dossier.open(patient);
  }

  closeDossier(): void {
    this.dossier.close();
  }

  initials(patient: PatientResponse): string {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
  }

  fullName(patient: PatientResponse): string {
    return `${patient.firstName} ${patient.lastName}`.trim();
  }

  ageDisplay(birthDate: string | null | undefined): string | null {
    if (!birthDate) return null;
    const [year, month, day] = birthDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} años`;
  }

  genderLabel(gender: string | null | undefined): string | null {
    if (!gender) return null;
    const map: Record<string, string> = { M: 'Masculino', F: 'Femenino', MALE: 'Masculino', FEMALE: 'Femenino', OTHER: 'Otro' };
    return map[gender.toUpperCase()] ?? gender;
  }

  imcValue(triage: TriageSummaryResponse): number | null {
    return computeImc(triage.weight, triage.height)?.value ?? null;
  }

  urgencyKeyOf(level: UrgencyLevel): 'normal' | 'urgent' | 'critical' {
    return urgencyKey(level);
  }

  urgencyText(level: UrgencyLevel): string {
    return urgencyLabel(level);
  }

  triageDate(triage: TriageSummaryResponse): string {
    const d = new Date(triage.createdAt);
    const day = d.getDate().toString().padStart(2, '0');
    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d);
    const time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} · ${time}`;
  }

  private splitClinical(raw: string | null): string[] {
    if (!raw) return [];
    return raw
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
