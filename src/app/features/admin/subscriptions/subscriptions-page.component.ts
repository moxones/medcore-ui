import { Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubscriptionStore } from '@core/stores/subscription.store';
import { OrganizationStore } from '@core/stores/organization.store';
import { SubscriptionResponse } from '@core/models/subscription.model';
import { SubscriptionFormDialogComponent } from '@shared/dialogs/subscription-form/subscription-form-dialog.component';
import { ConfirmDialogComponent } from '@shared/dialogs/confirm/confirm-dialog.component';

interface SubscriptionRow extends SubscriptionResponse {
  tenantName: string;
}

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './subscriptions-page.component.html',
  styleUrl: './subscriptions-page.component.scss',
})
export class SubscriptionsPageComponent implements OnInit {
  readonly store = inject(SubscriptionStore);
  private readonly orgStore = inject(OrganizationStore);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['tenant', 'plan', 'dates', 'status', 'actions'];

  readonly rows = computed<SubscriptionRow[]>(() => {
    const orgs = this.orgStore.items();
    return this.store.items().map((sub) => ({
      ...sub,
      tenantName: orgs.find((o) => o.id === sub.tenantId)?.name ?? `Org #${sub.tenantId}`,
    }));
  });

  ngOnInit(): void {
    void this.store.load();
    void this.orgStore.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(SubscriptionFormDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: {},
    });
    ref.afterClosed().subscribe((created) => {
      if (created) void this.store.load();
    });
  }

  openEdit(subscription: SubscriptionResponse): void {
    const ref = this.dialog.open(SubscriptionFormDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { subscription },
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) void this.store.load();
    });
  }

  confirmDelete(subscription: SubscriptionRow): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Eliminar suscripción',
        message: `¿Eliminar la suscripción de "${subscription.tenantName}" al plan "${subscription.plan.name}"?`,
        confirmLabel: 'Eliminar',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) void this.store.remove(subscription.id);
    });
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
  }
}
