import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CatalogStore } from '@core/stores/catalog.store';
import { CatalogItemResponse, CatalogKind, PlanResponse } from '@core/models/catalog.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';

type ClinicSection =
  | 'specialties'
  | 'appointmentTypes'
  | 'documentTypes'
  | 'plans'
  | 'appointmentStatuses'
  | 'subscriptionStatuses';

interface SectionCard {
  key: ClinicSection;
  label: string;
  icon: string;
  color: string;
  kind: CatalogKind | null;
}

type StatusFilter = 'all' | 'active' | 'available';

@Component({
  selector: 'app-catalogs-page',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule, MatTooltipModule, AlertBannerComponent, RelativeTimePipe],
  templateUrl: './catalogs-page.component.html',
  styleUrl: './catalogs-page.component.scss',
})
export class CatalogsPageComponent implements OnInit {
  readonly store = inject(CatalogStore);

  readonly activeSection = signal<ClinicSection>('specialties');
  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly durationDrafts = signal<Record<number, number>>({});

  readonly sections: SectionCard[] = [
    { key: 'specialties', label: 'Especialidades', icon: 'healing', color: '#2563EB', kind: 'specialties' },
    { key: 'appointmentTypes', label: 'Tipos de Cita', icon: 'event_note', color: '#DC2626', kind: 'appointmentTypes' },
    { key: 'documentTypes', label: 'Tipos de Documento', icon: 'badge', color: '#D97706', kind: 'documentTypes' },
    { key: 'plans', label: 'Planes', icon: 'workspace_premium', color: '#7C3AED', kind: null },
    { key: 'appointmentStatuses', label: 'Estados de Cita', icon: 'event_available', color: '#059669', kind: null },
    { key: 'subscriptionStatuses', label: 'Estados de Suscripción', icon: 'subscriptions', color: '#0891B2', kind: null },
  ];

  readonly activeCard = computed(
    () => this.sections.find((s) => s.key === this.activeSection())!,
  );

  readonly isActivatable = computed(() => this.activeCard().kind !== null);

  private readonly currentItems = computed((): CatalogItemResponse[] => {
    switch (this.activeSection()) {
      case 'specialties':
        return [...this.store.specialtiesActive(), ...this.store.specialtiesAvailable()];
      case 'appointmentTypes':
        return [...this.store.appointmentTypesActive(), ...this.store.appointmentTypesAvailable()];
      case 'documentTypes':
        return [...this.store.documentTypesActive(), ...this.store.documentTypesAvailable()];
      default:
        return [];
    }
  });

  readonly filteredItems = computed((): CatalogItemResponse[] => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    return this.currentItems().filter((item) => {
      if (filter === 'active' && !item.activated) return false;
      if (filter === 'available' && item.activated) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    });
  });

  readonly activeCount = computed(
    () => this.currentItems().filter((i) => i.activated).length,
  );

  readonly availableCount = computed(
    () => this.currentItems().filter((i) => !i.activated).length,
  );

  readonly readOnlyPlans = computed(() => this.store.plans());
  readonly readOnlyAppointmentStatuses = computed(() => this.store.appointmentStatuses());
  readonly readOnlySubscriptionStatuses = computed(() => this.store.subscriptionStatuses());

  ngOnInit(): void {
    void this.store.loadClinicCatalog('specialties');
  }

  setActiveSection(card: SectionCard): void {
    if (card.key === this.activeSection()) return;
    this.activeSection.set(card.key);
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.store.clearError();
    if (card.kind) {
      void this.store.loadClinicCatalog(card.kind);
    } else {
      void this.store.loadClinicReadOnly();
    }
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onDurationInput(itemId: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.durationDrafts.update((drafts) => ({ ...drafts, [itemId]: value }));
  }

  draftDuration(item: CatalogItemResponse): number {
    return this.durationDrafts()[item.id] ?? item.durationMinutes ?? 30;
  }

  isBusy(item: CatalogItemResponse): boolean {
    return this.store.busyItemId() === item.id;
  }

  async toggleItem(item: CatalogItemResponse): Promise<void> {
    const kind = this.activeCard().kind;
    if (!kind || this.isBusy(item)) return;
    if (item.activated) {
      await this.store.deactivate(kind, item.id);
      return;
    }
    const duration =
      kind === 'appointmentTypes' ? this.draftDuration(item) : undefined;
    await this.store.activate(kind, item.id, duration);
  }

  iconFor(section: ClinicSection): string {
    return this.sections.find((s) => s.key === section)!.icon;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
  }

  planLimits(plan: PlanResponse): string {
    return `${plan.maxUsers} usuarios · ${plan.maxBranches} sedes`;
  }
}
