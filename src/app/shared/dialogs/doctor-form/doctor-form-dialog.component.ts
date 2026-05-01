import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DoctorStore } from '@core/stores/doctor.store';

@Component({
  selector: 'app-doctor-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './doctor-form-dialog.component.html',
  styleUrl: './doctor-form-dialog.component.scss',
})
export class DoctorFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DoctorFormDialogComponent>);
  readonly store = inject(DoctorStore);

  readonly form = new FormGroup({
    personId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    licenseNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const ok = await this.store.create({
      person: { id: raw.personId! },
      licenseNumber: raw.licenseNumber,
    });
    if (ok) this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
