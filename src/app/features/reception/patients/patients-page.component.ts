import { ChangeDetectionStrategy, Component, OnInit, inject, computed } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientStore } from '@core/stores/patient.store';
import { PatientResponse } from '@core/models/patient.model';
import { PatientFormDialogComponent } from '@shared/dialogs/patient-form/patient-form-dialog.component';

@Component({
  selector: 'app-reception-patients-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceptionPatientsPageComponent implements OnInit {
  readonly store = inject(PatientStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl('');
  readonly patients = computed(() => this.store.page()?.content ?? []);
  readonly totalElements = computed(() => this.store.page()?.totalElements ?? 0);
  readonly pageNumber = computed(() => this.store.page()?.pageNumber ?? 0);
  readonly isLast = computed(() => this.store.page()?.last ?? true);
  readonly withEmailCount = computed(() => this.patients().filter((p) => p.contactEmail).length);
  readonly withoutEmailCount = computed(() => this.patients().filter((p) => !p.contactEmail).length);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((query) => {
        if (query && query.trim().length >= 2) {
          void this.store.search(query.trim());
        } else if (!query || query.trim() === '') {
          void this.store.load({ page: 0 });
        }
      });
  }

  ngOnInit(): void {
    void this.store.load({ page: 0 });
  }

  openNewPatient(): void {
    this.dialog
      .open(PatientFormDialogComponent, { width: '520px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((created: boolean) => {
        if (created) void this.store.load({ page: 0 });
      });
  }

  openEditPatient(patient: PatientResponse): void {
    this.dialog
      .open(PatientFormDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { patient },
      })
      .afterClosed()
      .subscribe((updated: boolean) => {
        if (updated) void this.store.load({ page: this.pageNumber() });
      });
  }

  openNewAppointment(patient: PatientResponse): void {
    void this.router.navigate(['/reception/new-appointment'], {
      queryParams: { patientId: patient.id },
    });
  }

  onPage(direction: 'prev' | 'next'): void {
    const next = direction === 'next' ? this.pageNumber() + 1 : this.pageNumber() - 1;
    void this.store.load({ page: next });
  }

  initials(patient: PatientResponse): string {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
  }

  ageDisplay(birthDate: string): string {
    const [year, month, day] = birthDate.split('-').map(Number);
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} años`;
  }
}
