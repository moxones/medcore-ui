import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PatientProfileStore } from '@core/stores/patient-profile.store';
import { AuthStore } from '@core/auth/auth.store';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { ChangePasswordDialogComponent } from '@shared/dialogs/change-password/change-password-dialog.component';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    AlertBannerComponent,
  ],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.scss',
})
export class PatientProfileComponent implements OnInit {
  readonly store = inject(PatientProfileStore);
  readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  readonly editing = signal(false);
  readonly saveSuccess = signal(false);

  readonly genderOptions = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'OTHER', label: 'Otro' },
  ];

  readonly initials = computed(() => {
    const parts = this.authStore.fullName().split(' ').filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  readonly genderLabel = computed(() => {
    const g = this.store.profile()?.gender;
    return this.genderOptions.find((o) => o.value === g)?.label ?? '—';
  });

  readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    phone: new FormControl('', { nonNullable: true }),
    gender: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl('', { nonNullable: true }),
    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
  });

  ngOnInit(): void {
    void this.store.loadProfile();
  }

  startEdit(): void {
    const p = this.store.profile();
    this.form.patchValue({
      firstName: p?.firstName ?? this.authStore.user()?.firstName ?? '',
      lastName: p?.lastName ?? this.authStore.user()?.lastName ?? '',
      phone: p?.phone ?? '',
      gender: p?.gender ?? '',
      birthDate: p?.birthDate ?? '',
      contactEmail: p?.contactEmail ?? '',
    });
    this.saveSuccess.set(false);
    this.store.clearError();
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const err = await this.store.saveProfile(this.form.getRawValue());
    if (!err) {
      this.editing.set(false);
      this.saveSuccess.set(true);
    }
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
    });
  }

  formatDate(date: string | null): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }
}
