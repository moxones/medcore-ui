import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '@core/services/patient.service';
import { AuthStore } from '@core/auth/auth.store';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-complete-profile-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AlertBannerComponent,
  ],
  templateUrl: './complete-profile-dialog.component.html',
  styleUrl: './complete-profile-dialog.component.scss',
})
export class CompleteProfileDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CompleteProfileDialogComponent>);
  private readonly service = inject(PatientService);
  readonly authStore = inject(AuthStore);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

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
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  readonly filledCount = computed(() => {
    const { firstName, lastName } = this.formValue();
    return [(firstName ?? '').trim(), (lastName ?? '').trim()].filter((v) => v.length > 0).length;
  });

  readonly canSubmit = computed(() => this.formStatus() === 'VALID' && !this.saving());

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const { firstName, lastName, phone } = this.form.getRawValue();
      await firstValueFrom(
        this.service.updateProfile({
          firstName,
          lastName,
          phone: phone.trim() || null,
        }),
      );
      this.authStore.markProfileCompleted(firstName, lastName);
      this.dialogRef.close(true);
    } catch {
      this.error.set('Error al guardar el perfil. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  logout(): void {
    void this.authStore.logout();
    this.dialogRef.close(false);
  }
}
