import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { CatalogStore } from '@core/stores/catalog.store';
import { AuthStore } from '@core/auth/auth.store';
import { OrganizationStore } from '@core/stores/organization.store';
import { AppointmentTypeResponse, CatalogItemResponse, SpecialtyResponse } from '@core/models/catalog.model';

export type CatalogSection =
  | 'specialties'
  | 'plans'
  | 'documentTypes'
  | 'subscriptionStatuses'
  | 'appointmentStatuses'
  | 'appointmentTypes';

interface CatalogCard {
  key: CatalogSection;
  label: string;
  icon: string;
  color: string;
  isTenantSpecific: boolean;
  superAdminOnly: boolean;
  globalReadOnly: boolean;
}

@Component({
  selector: 'app-catalogs-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
  ],
  templateUrl: './catalogs-page.component.html',
  styleUrl: './catalogs-page.component.scss',
})
export class CatalogsPageComponent implements OnInit {
  readonly store = inject(CatalogStore);
  readonly authStore = inject(AuthStore);
  readonly orgStore = inject(OrganizationStore);

  readonly activeSection = signal<CatalogSection>('specialties');
  readonly showForm = signal(false);
  readonly searchQuery = signal('');

  readonly catalogCards: CatalogCard[] = [
    { key: 'specialties',         label: 'Especialidades',     icon: 'healing',         color: '#2563EB', isTenantSpecific: true,  superAdminOnly: false, globalReadOnly: false },
    { key: 'plans',               label: 'Planes',             icon: 'local_offer',     color: '#7C3AED', isTenantSpecific: false, superAdminOnly: true,  globalReadOnly: false },
    { key: 'documentTypes',       label: 'Tipos de Documento', icon: 'badge',           color: '#D97706', isTenantSpecific: false, superAdminOnly: false, globalReadOnly: true  },
    { key: 'subscriptionStatuses',label: 'Est. Suscripción',   icon: 'subscriptions',   color: '#0891B2', isTenantSpecific: false, superAdminOnly: true,  globalReadOnly: false },
    { key: 'appointmentStatuses', label: 'Est. de Cita',       icon: 'event_available', color: '#059669', isTenantSpecific: false, superAdminOnly: false, globalReadOnly: true  },
    { key: 'appointmentTypes',    label: 'Tipos de Cita',      icon: 'calendar_today',  color: '#DC2626', isTenantSpecific: true,  superAdminOnly: false, globalReadOnly: false },
  ];

  readonly visibleCards = computed(() =>
    this.authStore.isSuperAdmin()
      ? this.catalogCards
      : this.catalogCards.filter((c) => !c.superAdminOnly),
  );

  readonly activeCard = computed(
    () => this.catalogCards.find((c) => c.key === this.activeSection()),
  );

  readonly activeSectionLabel = computed(() => this.activeCard()?.label ?? '');

  readonly isTenantSpecificSection = computed(() => this.activeCard()?.isTenantSpecific ?? false);

  readonly showTenantSelector = computed(
    () => this.authStore.isSuperAdmin() && this.isTenantSpecificSection(),
  );

  readonly needsTenantSelection = computed(
    () => this.showTenantSelector() && this.store.selectedTenantId() === null,
  );

  readonly showReadOnlyBanner = computed(() => {
    if (this.authStore.isSuperAdmin()) return false;
    return this.activeCard()?.globalReadOnly ?? false;
  });

  readonly canModifySection = computed(() => {
    const card = this.activeCard();
    if (!card) return false;
    if (this.authStore.isSuperAdmin()) {
      return !(card.isTenantSpecific && this.store.selectedTenantId() === null);
    }
    return !card.globalReadOnly;
  });

  readonly filteredSpecialties = computed(() => filterByQuery(this.store.specialties(), this.searchQuery()));
  readonly filteredPlans = computed(() => filterByQuery(this.store.plans(), this.searchQuery()));
  readonly filteredDocumentTypes = computed(() => filterByQuery(this.store.documentTypes(), this.searchQuery()));
  readonly filteredSubscriptionStatuses = computed(() => filterByQuery(this.store.subscriptionStatuses(), this.searchQuery()));
  readonly filteredAppointmentStatuses = computed(() => filterByQuery(this.store.appointmentStatuses(), this.searchQuery()));
  readonly filteredAppointmentTypes = computed(() => filterByQuery(this.store.appointmentTypes(), this.searchQuery()));

  readonly specialtyForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly appointmentTypeForm = new FormGroup({
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

  readonly simpleForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    if (this.authStore.isSuperAdmin()) {
      void this.orgStore.load();
    }
    const firstVisible = this.visibleCards()[0];
    if (firstVisible) this.activeSection.set(firstVisible.key);

    void this.store.loadPlans();
    void this.store.loadDocumentTypes();
    void this.store.loadSubscriptionStatuses();
    void this.store.loadAppointmentStatuses();
    if (!this.authStore.isSuperAdmin()) {
      void this.store.loadSpecialties();
      void this.store.loadAppointmentTypes();
    }
  }

  setActiveSection(key: CatalogSection): void {
    this.activeSection.set(key);
    this.showForm.set(false);
    this.searchQuery.set('');
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onTenantChange(id: number): void {
    this.store.setSelectedTenantId(id);
    void this.store.loadSpecialties();
    void this.store.loadAppointmentTypes();
    this.showForm.set(false);
  }

  catalogCount(key: CatalogSection): number {
    switch (key) {
      case 'specialties':          return this.store.specialties().length;
      case 'plans':                return this.store.plans().length;
      case 'documentTypes':        return this.store.documentTypes().length;
      case 'subscriptionStatuses': return this.store.subscriptionStatuses().length;
      case 'appointmentStatuses':  return this.store.appointmentStatuses().length;
      case 'appointmentTypes':     return this.store.appointmentTypes().length;
    }
  }

  isLoading(key: CatalogSection): boolean {
    switch (key) {
      case 'specialties':          return this.store.loadingSpecialties();
      case 'plans':                return this.store.loadingPlans();
      case 'documentTypes':        return this.store.loadingDocumentTypes();
      case 'subscriptionStatuses': return this.store.loadingSubscriptionStatuses();
      case 'appointmentStatuses':  return this.store.loadingAppointmentStatuses();
      case 'appointmentTypes':     return this.store.loadingAppointmentTypes();
    }
  }

  dotColor(index: number): string {
    const palette = ['#2196F3', '#F44336', '#009688', '#FF9800', '#9C27B0', '#4CAF50', '#FF5722', '#E91E63', '#00BCD4', '#795548'];
    return palette[index % palette.length];
  }

  formatModified(dateStr?: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMin < 1) return 'hace un momento';
    if (diffHour < 1) return `hace ${diffMin} min`;
    if (diffDay < 1) return `hace ${diffHour}h`;
    if (diffDay === 1) return 'ayer';
    if (diffDay < 7) return `hace ${diffDay} días`;
    if (diffWeek === 1) return 'hace 1 semana';
    if (diffWeek < 4) return `hace ${diffWeek} semanas`;
    if (diffMonth === 1) return 'hace 1 mes';
    return `hace ${diffMonth} meses`;
  }

  modifierName(item: { updatedByName?: string | null; updatedById?: number | null }): string {
    if (item.updatedByName) return item.updatedByName;
    if (item.updatedById) return `Usuario #${item.updatedById}`;
    return 'Sistema';
  }

  async submitSpecialty(): Promise<void> {
    if (this.specialtyForm.invalid) { this.specialtyForm.markAllAsTouched(); return; }
    const ok = await this.store.createSpecialty(this.specialtyForm.getRawValue());
    if (ok) { this.specialtyForm.reset({ name: '', code: '' }); this.showForm.set(false); }
  }

  async submitAppointmentType(): Promise<void> {
    if (this.appointmentTypeForm.invalid) { this.appointmentTypeForm.markAllAsTouched(); return; }
    const ok = await this.store.createAppointmentType(this.appointmentTypeForm.getRawValue());
    if (ok) { this.appointmentTypeForm.reset({ name: '', code: '' }); this.showForm.set(false); }
  }

  async submitPlan(): Promise<void> {
    if (this.planForm.invalid) { this.planForm.markAllAsTouched(); return; }
    const ok = await this.store.createPlan(this.planForm.getRawValue());
    if (ok) { this.planForm.reset({ name: '', code: '', price: 0, maxUsers: 5, maxBranches: 1 }); this.showForm.set(false); }
  }

  async submitSimple(): Promise<void> {
    if (this.simpleForm.invalid) { this.simpleForm.markAllAsTouched(); return; }
    const value = this.simpleForm.getRawValue();
    let ok = false;
    switch (this.activeSection()) {
      case 'documentTypes':        ok = await this.store.createDocumentType(value); break;
      case 'subscriptionStatuses': ok = await this.store.createSubscriptionStatus(value); break;
      case 'appointmentStatuses':  ok = await this.store.createAppointmentStatus(value); break;
      default: return;
    }
    if (ok) { this.simpleForm.reset({ name: '', code: '' }); this.showForm.set(false); }
  }

  deleteSpecialty(item: SpecialtyResponse): void { void this.store.deleteSpecialty(item.id); }
  deleteAppointmentType(item: AppointmentTypeResponse): void { void this.store.deleteAppointmentType(item.id); }
  deletePlan(item: CatalogItemResponse): void { void this.store.deletePlan(item.id); }
  deleteDocumentType(item: CatalogItemResponse): void { void this.store.deleteDocumentType(item.id); }
  deleteSubscriptionStatus(item: CatalogItemResponse): void { void this.store.deleteSubscriptionStatus(item.id); }
  deleteAppointmentStatus(item: CatalogItemResponse): void { void this.store.deleteAppointmentStatus(item.id); }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
  }
}

function filterByQuery<T extends { name: string; code: string }>(items: T[], query: string): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter((i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
}
