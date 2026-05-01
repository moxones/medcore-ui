import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import chroma from 'chroma-js';
import { OrganizationStore } from '@core/stores/organization.store';
import { TenantResponse, TenantStatus } from '@core/models/organization.model';

export interface OrganizationFormDialogData {
  tenant?: TenantResponse;
}

@Component({
  selector: 'app-organization-form-dialog',
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
    MatTooltipModule,
  ],
  templateUrl: './organization-form-dialog.component.html',
  styleUrl: './organization-form-dialog.component.scss',
})
export class OrganizationFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<OrganizationFormDialogComponent>);
  private readonly data = inject<OrganizationFormDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(OrganizationStore);

  readonly isEdit = !!this.data?.tenant;
  readonly tenant = this.data?.tenant;

  readonly colorPalette: string[] = [
    '#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6',
    '#0891B2', '#0E7490', '#0D9488', '#0F766E',
    '#16A34A', '#15803D', '#059669', '#047857',
    '#7C3AED', '#6D28D9', '#9333EA', '#7E22CE',
    '#E11D48', '#BE185D', '#DC2626', '#B91C1C',
    '#D97706', '#B45309', '#EA580C', '#C2410C',
  ];

  readonly form = new FormGroup({
    subdomain: new FormControl(
      { value: '', disabled: this.isEdit },
      {
        nonNullable: true,
        validators: this.isEdit ? [] : [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)],
      },
    ),
    name: new FormControl(this.tenant?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    subtitle: new FormControl(this.tenant?.subtitle ?? '', { nonNullable: true }),
    logoUrl: new FormControl(this.tenant?.logoUrl ?? '', { nonNullable: true }),
    primaryColor: new FormControl(this.tenant?.primaryColor ?? '', {
      nonNullable: true,
      validators: [Validators.pattern(/^(#[0-9A-Fa-f]{6})?$/)],
    }),
    status: new FormControl<TenantStatus>(
      { value: this.tenant?.status ?? 'ACTIVE', disabled: !this.isEdit },
      { nonNullable: true },
    ),
  });

  selectColor(hex: string): void {
    this.form.controls.primaryColor.setValue(hex);
    this.form.controls.primaryColor.markAsTouched();
  }

  isSelected(hex: string): boolean {
    return this.form.controls.primaryColor.value === hex;
  }

  swatchTextColor(hex: string): string {
    return chroma.contrast(hex, '#ffffff') >= 4 ? '#ffffff' : '#000000';
  }

  get colorPreview(): string {
    const val = this.form.controls.primaryColor.value;
    return chroma.valid(val) ? val : 'transparent';
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    let ok: boolean;

    if (this.isEdit && this.tenant) {
      ok = await this.store.update(this.tenant.id, {
        name: raw.name,
        status: raw.status,
        logoUrl: raw.logoUrl || undefined,
        primaryColor: raw.primaryColor || undefined,
        subtitle: raw.subtitle || undefined,
      });
    } else {
      ok = await this.store.create({
        subdomain: raw.subdomain,
        name: raw.name,
        logoUrl: raw.logoUrl || undefined,
        primaryColor: raw.primaryColor || undefined,
        subtitle: raw.subtitle || undefined,
      });
    }

    if (ok) this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
