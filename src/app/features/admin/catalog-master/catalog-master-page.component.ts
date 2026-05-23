import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CatalogStore } from '@core/stores/catalog.store';
import { MasterCatalogItem, MasterKind, PlanResponse } from '@core/models/catalog.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import {
  CatalogMasterFormDialogComponent,
  CatalogMasterFormDialogData,
} from '@shared/dialogs/catalog-master-form/catalog-master-form-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '@shared/dialogs/confirm/confirm-dialog.component';

interface MasterSection {
  key: MasterKind;
  label: string;
  singular: string;
  icon: string;
  color: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-catalog-master-page',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    AlertBannerComponent,
    RelativeTimePipe,
  ],
  templateUrl: './catalog-master-page.component.html',
  styleUrl: './catalog-master-page.component.scss',
})
export class CatalogMasterPageComponent implements OnInit {
  readonly store = inject(CatalogStore);
  private readonly dialog = inject(MatDialog);

  readonly activeSection = signal<MasterKind>('specialties');
  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly sections: MasterSection[] = [
    { key: 'specialties', label: 'Especialidades', singular: 'Especialidad', icon: 'healing', color: '#2563EB' },
    { key: 'appointmentTypes', label: 'Tipos de Cita', singular: 'Tipo de Cita', icon: 'event_note', color: '#DC2626' },
    { key: 'documentTypes', label: 'Tipos de Documento', singular: 'Tipo de Documento', icon: 'badge', color: '#D97706' },
    { key: 'plans', label: 'Planes', singular: 'Plan', icon: 'workspace_premium', color: '#7C3AED' },
    { key: 'subscriptionStatuses', label: 'Estados de Suscripción', singular: 'Estado de Suscripción', icon: 'subscriptions', color: '#0891B2' },
    { key: 'appointmentStatuses', label: 'Estados de Cita', singular: 'Estado de Cita', icon: 'event_available', color: '#059669' },
  ];

  readonly activeCard = computed(
    () => this.sections.find((s) => s.key === this.activeSection())!,
  );

  readonly isPlans = computed(() => this.activeSection() === 'plans');

  private readonly currentItems = computed((): MasterCatalogItem[] => {
    switch (this.activeSection()) {
      case 'specialties':
        return this.store.masterSpecialties();
      case 'appointmentTypes':
        return this.store.masterAppointmentTypes();
      case 'documentTypes':
        return this.store.masterDocumentTypes();
      case 'plans':
        return this.store.masterPlans();
      case 'subscriptionStatuses':
        return this.store.masterSubscriptionStatuses();
      case 'appointmentStatuses':
        return this.store.masterAppointmentStatuses();
    }
  });

  readonly filteredItems = computed((): MasterCatalogItem[] => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    return this.currentItems().filter((item) => {
      if (filter === 'active' && !item.isActive) return false;
      if (filter === 'inactive' && item.isActive) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    });
  });

  readonly activeCount = computed(
    () => this.currentItems().filter((i) => i.isActive).length,
  );

  ngOnInit(): void {
    this.reloadActive();
  }

  setActiveSection(section: MasterSection): void {
    if (section.key === this.activeSection()) return;
    this.activeSection.set(section.key);
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.store.clearError();
    this.reloadActive();
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  asPlan(item: MasterCatalogItem): PlanResponse {
    return item as PlanResponse;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(item: MasterCatalogItem): void {
    this.openForm(structuredClone(item));
  }

  openDelete(item: MasterCatalogItem): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '400px',
        data: {
          title: `Eliminar ${this.activeCard().singular.toLowerCase()}`,
          message: `¿Deseas eliminar "${item.name}"? Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
        },
      },
    );
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) void this.deleteItem(item.id);
    });
  }

  private openForm(item: MasterCatalogItem | null): void {
    const ref = this.dialog.open<
      CatalogMasterFormDialogComponent,
      CatalogMasterFormDialogData,
      boolean
    >(CatalogMasterFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        kind: this.activeSection(),
        title: this.activeCard().singular,
        item,
      },
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) this.reloadActive();
    });
  }

  private deleteItem(id: number): void {
    switch (this.activeSection()) {
      case 'specialties':
        void this.store.deleteMasterSpecialty(id);
        break;
      case 'appointmentTypes':
        void this.store.deleteMasterAppointmentType(id);
        break;
      case 'documentTypes':
        void this.store.deleteMasterDocumentType(id);
        break;
      case 'plans':
        void this.store.deleteMasterPlan(id);
        break;
      case 'subscriptionStatuses':
        void this.store.deleteMasterSubscriptionStatus(id);
        break;
      case 'appointmentStatuses':
        void this.store.deleteMasterAppointmentStatus(id);
        break;
    }
  }

  private reloadActive(): void {
    switch (this.activeSection()) {
      case 'specialties':
        void this.store.loadMasterSpecialties();
        break;
      case 'appointmentTypes':
        void this.store.loadMasterAppointmentTypes();
        break;
      case 'documentTypes':
        void this.store.loadMasterDocumentTypes();
        break;
      case 'plans':
        void this.store.loadMasterPlans();
        break;
      case 'subscriptionStatuses':
        void this.store.loadMasterSubscriptionStatuses();
        break;
      case 'appointmentStatuses':
        void this.store.loadMasterAppointmentStatuses();
        break;
    }
  }
}
