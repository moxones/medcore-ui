import { Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubscriptionStore } from '@core/stores/subscription.store';
import { OrganizationStore } from '@core/stores/organization.store';
import { CatalogStore } from '@core/stores/catalog.store';
import { SubscriptionResponse, SubscriptionStatus } from '@core/models/subscription.model';

export interface SubscriptionFormDialogData {
  subscription?: SubscriptionResponse;
}

@Component({
  selector: 'app-subscription-form-dialog',
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
  ],
  templateUrl: './subscription-form-dialog.component.html',
  styleUrl: './subscription-form-dialog.component.scss',
})
export class SubscriptionFormDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<SubscriptionFormDialogComponent>);
  private readonly data = inject<SubscriptionFormDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(SubscriptionStore);
  readonly orgStore = inject(OrganizationStore);
  readonly catalogStore = inject(CatalogStore);

  readonly isEdit = !!this.data?.subscription;
  readonly subscription = this.data?.subscription;

  readonly tenantName = computed(() =>
    this.orgStore.items().find((o) => o.id === this.subscription?.tenantId)?.name ??
    `Organización #${this.subscription?.tenantId}`,
  );

  readonly statusOptions: { value: SubscriptionStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
    { value: 'EXPIRED', label: 'Expirado' },
  ];

  readonly form = new FormGroup({
    tenantId: new FormControl<number | null>(
      { value: this.subscription?.tenantId ?? null, disabled: this.isEdit },
      { validators: [Validators.required] },
    ),
    planId: new FormControl<number | null>(this.subscription?.plan.id ?? null, {
      validators: [Validators.required],
    }),
    startDate: new FormControl(this.subscription?.startDate ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    endDate: new FormControl(this.subscription?.endDate ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<SubscriptionStatus>(this.subscription?.status ?? 'ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    if (this.orgStore.items().length === 0) void this.orgStore.load();
    if (this.catalogStore.plans().length === 0) void this.catalogStore.loadPlans();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    let ok: boolean;

    if (this.isEdit && this.subscription) {
      ok = await this.store.update(this.subscription.id, {
        planId: raw.planId!,
        startDate: raw.startDate,
        endDate: raw.endDate,
        status: raw.status,
      });
    } else {
      ok = await this.store.create({
        tenantId: raw.tenantId!,
        planId: raw.planId!,
        startDate: raw.startDate,
        endDate: raw.endDate,
        status: raw.status,
      });
    }

    if (ok) this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
