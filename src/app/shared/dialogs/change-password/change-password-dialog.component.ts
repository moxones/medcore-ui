import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';

function passwordMatchValidator(group: AbstractControl) {
  const newPwd = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return newPwd && confirm && newPwd !== confirm ? { mismatch: true } : null;
}

function computeStrength(pwd: string) {
  if (!pwd) return { label: '', color: '', width: 0 };
  const score = [
    pwd.length >= 8,
    /[a-z]/.test(pwd),
    /[A-Z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ].filter(Boolean).length;

  if (score <= 1) return { label: 'Muy débil', color: '#dc2626', width: 20 };
  if (score === 2) return { label: 'Débil', color: '#f97316', width: 40 };
  if (score === 3) return { label: 'Regular', color: '#eab308', width: 60 };
  if (score === 4) return { label: 'Fuerte', color: '#22c55e', width: 80 };
  return { label: 'Excelente', color: '#16a34a', width: 100 };
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
})
export class ChangePasswordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private readonly authService = inject(AuthService);

  readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator },
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly strengthInfo = toSignal(
    this.form.get('newPassword')!.valueChanges.pipe(
      startWith(''),
      map((pwd) => computeStrength(pwd ?? '')),
    ),
    { initialValue: { label: '', color: '', width: 0 } },
  );

  get currentPwd() {
    return this.form.get('currentPassword')!;
  }
  get newPwd() {
    return this.form.get('newPassword')!;
  }
  get confirmPwd() {
    return this.form.get('confirmPassword')!;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.authService.changePassword({
          currentPassword: this.form.value.currentPassword!,
          newPassword: this.form.value.newPassword!,
        }),
      );
      this.dialogRef.close(true);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cambiar la contraseña');
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
