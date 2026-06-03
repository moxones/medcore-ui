import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { PatientStore } from '@core/stores/patient.store';
import { CatalogService } from '@core/services/catalog.service';
import { CatalogItemResponse } from '@core/models/catalog.model';
import { PatientResponse } from '@core/models/patient.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface PatientFormDialogData {
  patient: PatientResponse;
}

@Component({
  selector: 'app-patient-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AlertBannerComponent,
  ],
  templateUrl: './patient-form-dialog.component.html',
  styleUrl: './patient-form-dialog.component.scss',
})
export class PatientFormDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<PatientFormDialogComponent>);
  private readonly data = inject<PatientFormDialogData | null>(MAT_DIALOG_DATA);
  readonly store = inject(PatientStore);
  private readonly catalogService = inject(CatalogService);

  readonly isEditMode: boolean = !!this.data?.patient;
  readonly documentTypes = signal<CatalogItemResponse[]>([]);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    documentTypeCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    birthDate: new FormControl('', { nonNullable: true }),
    contactEmail: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    gender: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    if (this.isEditMode) {
      this.form.controls.documentTypeCode.clearValidators();
      this.form.controls.documentTypeCode.updateValueAndValidity();
      this.form.controls.documentNumber.clearValidators();
      this.form.controls.documentNumber.updateValueAndValidity();

      const patient = this.data!.patient;
      this.form.patchValue({
        firstName: patient.firstName,
        lastName: patient.lastName,
        contactEmail: patient.contactEmail ?? '',
        birthDate: patient.birthDate ?? '',
        phone: patient.phone ?? '',
        gender: patient.gender ?? '',
      });
    }
  }

  async ngOnInit(): Promise<void> {
    if (this.isEditMode) return;
    try {
      const res = await firstValueFrom(this.catalogService.getClinicDocumentTypes());
      const active = res.data.filter((d) => d.tenantActive);
      this.documentTypes.set(active);
      if (active.length > 0) {
        this.form.controls.documentTypeCode.setValue(active[0].code);
      }
    } catch {
      // keep empty — user can still submit
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    const raw = this.form.getRawValue();

    if (this.isEditMode) {
      const err = await this.store.update(this.data!.patient.id, {
        firstName: raw.firstName,
        lastName: raw.lastName,
        birthDate: raw.birthDate || null,
        contactEmail: raw.contactEmail || null,
        phone: raw.phone || null,
        gender: raw.gender || null,
      });
      if (!err) {
        this.dialogRef.close(true);
      } else {
        this.error.set(err);
      }
    } else {
      const err = await this.store.create({
        firstName: raw.firstName,
        lastName: raw.lastName,
        documentTypeCode: raw.documentTypeCode,
        documentNumber: raw.documentNumber,
        ...(raw.birthDate ? { birthDate: raw.birthDate } : {}),
      });
      if (!err) {
        this.dialogRef.close(true);
      } else {
        this.error.set(err);
      }
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
