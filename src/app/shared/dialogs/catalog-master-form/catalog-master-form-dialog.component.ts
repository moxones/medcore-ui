import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogStore } from '@core/stores/catalog.store';
import { MasterCatalogItem, MasterKind, PlanResponse } from '@core/models/catalog.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface CatalogMasterFormDialogData {
  kind: MasterKind;
  title: string;
  item?: MasterCatalogItem | PlanResponse | null;
}

@Component({
  selector: 'app-catalog-master-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    AlertBannerComponent,
  ],
  templateUrl: './catalog-master-form-dialog.component.html',
  styleUrl: './catalog-master-form-dialog.component.scss',
})
export class CatalogMasterFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CatalogMasterFormDialogComponent>);
  readonly data = inject<CatalogMasterFormDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(CatalogStore);

  readonly formError = signal<string | null>(null);

  readonly isEdit = computed(() => !!this.data.item);
  readonly showDescription = computed(() => this.data.kind === 'specialties');
  readonly showDuration = computed(() => this.data.kind === 'appointmentTypes');
  readonly showPlanFields = computed(() => this.data.kind === 'plans');

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    durationMinutes: new FormControl<number>(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(5)],
    }),
    price: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    maxUsers: new FormControl<number>(5, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    maxBranches: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    isActive: new FormControl<boolean>(true, { nonNullable: true }),
  });

  constructor() {
    const item = this.data.item;
    if (item) {
      this.form.patchValue({
        code: item.code,
        name: item.name,
        isActive: item.isActive,
      });
      if ('description' in item && item.description) {
        this.form.controls.description.setValue(item.description);
      }
      if ('durationMinutes' in item && item.durationMinutes != null) {
        this.form.controls.durationMinutes.setValue(item.durationMinutes);
      }
      if ('price' in item) {
        this.form.patchValue({
          price: item.price,
          maxUsers: item.maxUsers,
          maxBranches: item.maxBranches,
        });
      }
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formError.set(null);
    const error = await this.dispatch();
    if (error) {
      this.formError.set(error);
      return;
    }
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private dispatch(): Promise<string | null> {
    const v = this.form.getRawValue();
    const id = this.data.item?.id;

    switch (this.data.kind) {
      case 'specialties': {
        const body = {
          code: v.code,
          name: v.name,
          description: v.description,
          isActive: v.isActive,
        };
        return id
          ? this.store.updateMasterSpecialty(id, body)
          : this.store.createMasterSpecialty(body);
      }
      case 'appointmentTypes': {
        const body = {
          code: v.code,
          name: v.name,
          durationMinutes: v.durationMinutes,
          isActive: v.isActive,
        };
        return id
          ? this.store.updateMasterAppointmentType(id, body)
          : this.store.createMasterAppointmentType(body);
      }
      case 'documentTypes': {
        const body = { code: v.code, name: v.name, isActive: v.isActive };
        return id
          ? this.store.updateMasterDocumentType(id, body)
          : this.store.createMasterDocumentType(body);
      }
      case 'plans': {
        const body = {
          code: v.code,
          name: v.name,
          price: v.price,
          maxUsers: v.maxUsers,
          maxBranches: v.maxBranches,
          isActive: v.isActive,
        };
        return id
          ? this.store.updateMasterPlan(id, body)
          : this.store.createMasterPlan(body);
      }
      case 'subscriptionStatuses': {
        const body = { code: v.code, name: v.name, isActive: v.isActive };
        return id
          ? this.store.updateMasterSubscriptionStatus(id, body)
          : this.store.createMasterSubscriptionStatus(body);
      }
      case 'appointmentStatuses': {
        const body = { code: v.code, name: v.name, isActive: v.isActive };
        return id
          ? this.store.updateMasterAppointmentStatus(id, body)
          : this.store.createMasterAppointmentStatus(body);
      }
    }
  }
}
