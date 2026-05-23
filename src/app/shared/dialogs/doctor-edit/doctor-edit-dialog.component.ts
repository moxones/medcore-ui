import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DoctorStore } from '@core/stores/doctor.store';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface DoctorEditDialogData {
  doctorId: number;
  licenseNumber: string;
  doctorName: string;
}

@Component({
  selector: 'app-doctor-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-edit-dialog.component.html',
  styleUrl: './doctor-edit-dialog.component.scss',
})
export class DoctorEditDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DoctorEditDialogComponent>);
  readonly data = inject<DoctorEditDialogData>(MAT_DIALOG_DATA);
  private readonly store = inject(DoctorStore);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly licenseControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });

  ngOnInit(): void {
    this.licenseControl.setValue(this.data.licenseNumber ?? '');
  }

  async save(): Promise<void> {
    if (this.licenseControl.invalid) {
      this.licenseControl.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const ok = await this.store.updateLicense(this.data.doctorId, this.licenseControl.value.trim());
    this.saving.set(false);
    if (ok) {
      this.dialogRef.close(true);
    } else {
      this.error.set('No se pudo actualizar la matrícula. Intenta de nuevo.');
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  clearError(): void {
    this.error.set(null);
  }
}
