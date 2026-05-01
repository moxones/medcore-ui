import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CatalogStore } from '@core/stores/catalog.store';
import { CatalogItemResponse } from '@core/models/catalog.model';

@Component({
  selector: 'app-catalogs-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './catalogs-page.component.html',
  styleUrl: './catalogs-page.component.scss',
})
export class CatalogsPageComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly simpleColumns = ['name', 'code', 'actions'];
  readonly specialtyColumns = ['name', 'code', 'actions'];
  readonly planColumns = ['name', 'code', 'price', 'limits', 'actions'];

  readonly specialtyForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly planForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    maxUsers: new FormControl<number>(5, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    maxBranches: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
  });

  readonly documentTypeForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly subscriptionStatusForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly appointmentStatusForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly appointmentTypeForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    void this.store.loadSpecialties();
    void this.store.loadPlans();
    void this.store.loadDocumentTypes();
    void this.store.loadSubscriptionStatuses();
    void this.store.loadAppointmentStatuses();
    void this.store.loadAppointmentTypes();
  }

  async submitSpecialty(): Promise<void> {
    if (this.specialtyForm.invalid) { this.specialtyForm.markAllAsTouched(); return; }
    const ok = await this.store.createSpecialty(this.specialtyForm.getRawValue());
    if (ok) this.specialtyForm.reset({ name: '', code: '' });
  }

  async submitPlan(): Promise<void> {
    if (this.planForm.invalid) { this.planForm.markAllAsTouched(); return; }
    const ok = await this.store.createPlan(this.planForm.getRawValue());
    if (ok) this.planForm.reset({ name: '', code: '', price: 0, maxUsers: 5, maxBranches: 1 });
  }

  async submitDocumentType(): Promise<void> {
    if (this.documentTypeForm.invalid) { this.documentTypeForm.markAllAsTouched(); return; }
    const ok = await this.store.createDocumentType(this.documentTypeForm.getRawValue());
    if (ok) this.documentTypeForm.reset({ name: '', code: '' });
  }

  async submitSubscriptionStatus(): Promise<void> {
    if (this.subscriptionStatusForm.invalid) { this.subscriptionStatusForm.markAllAsTouched(); return; }
    const ok = await this.store.createSubscriptionStatus(this.subscriptionStatusForm.getRawValue());
    if (ok) this.subscriptionStatusForm.reset({ name: '', code: '' });
  }

  async submitAppointmentStatus(): Promise<void> {
    if (this.appointmentStatusForm.invalid) { this.appointmentStatusForm.markAllAsTouched(); return; }
    const ok = await this.store.createAppointmentStatus(this.appointmentStatusForm.getRawValue());
    if (ok) this.appointmentStatusForm.reset({ name: '', code: '' });
  }

  async submitAppointmentType(): Promise<void> {
    if (this.appointmentTypeForm.invalid) { this.appointmentTypeForm.markAllAsTouched(); return; }
    const ok = await this.store.createAppointmentType(this.appointmentTypeForm.getRawValue());
    if (ok) this.appointmentTypeForm.reset({ name: '', code: '' });
  }

  deleteSpecialty(item: CatalogItemResponse): void { void this.store.deleteSpecialty(item.id); }
  deletePlan(item: CatalogItemResponse): void { void this.store.deletePlan(item.id); }
  deleteDocumentType(item: CatalogItemResponse): void { void this.store.deleteDocumentType(item.id); }
  deleteSubscriptionStatus(item: CatalogItemResponse): void { void this.store.deleteSubscriptionStatus(item.id); }
  deleteAppointmentStatus(item: CatalogItemResponse): void { void this.store.deleteAppointmentStatus(item.id); }
  deleteAppointmentType(item: CatalogItemResponse): void { void this.store.deleteAppointmentType(item.id); }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
  }
}
