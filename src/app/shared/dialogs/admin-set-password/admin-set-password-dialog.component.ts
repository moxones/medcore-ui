import { Component, inject, Inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { UserStore } from '@core/stores/user.store';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface AdminSetPasswordDialogData {
  userId: number;
  userName: string;
}

function passwordMatchValidator(group: AbstractControl) {
  const pwd = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { mismatch: true } : null;
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
  selector: 'app-admin-set-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AlertBannerComponent,
  ],
  templateUrl: './admin-set-password-dialog.component.html',
  styleUrl: './admin-set-password-dialog.component.scss',
})
export class AdminSetPasswordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AdminSetPasswordDialogComponent>);
  readonly store = inject(UserStore);

  readonly data: AdminSetPasswordDialogData;
  readonly error = signal<string | null>(null);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly form = new FormGroup(
    {
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator },
  );

  readonly strengthInfo = toSignal(
    this.form.get('newPassword')!.valueChanges.pipe(
      startWith(''),
      map((pwd) => computeStrength(pwd ?? '')),
    ),
    { initialValue: { label: '', color: '', width: 0 } },
  );

  get newPwd() {
    return this.form.get('newPassword')!;
  }
  get confirmPwd() {
    return this.form.get('confirmPassword')!;
  }

  constructor(@Inject(MAT_DIALOG_DATA) data: AdminSetPasswordDialogData) {
    this.data = data;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    const err = await this.store.setUserPassword(this.data.userId, this.form.value.newPassword ?? '');
    if (err) {
      this.error.set(err);
    } else {
      this.dialogRef.close(true);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
