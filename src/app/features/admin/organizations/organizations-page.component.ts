import { Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrganizationStore } from '@core/stores/organization.store';
import { TenantResponse } from '@core/models/organization.model';
import { OrganizationFormDialogComponent } from '@shared/dialogs/organization-form/organization-form-dialog.component';
import { ConfirmDialogComponent } from '@shared/dialogs/confirm/confirm-dialog.component';

@Component({
  selector: 'app-organizations-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './organizations-page.component.html',
  styleUrl: './organizations-page.component.scss',
})
export class OrganizationsPageComponent implements OnInit {
  readonly store = inject(OrganizationStore);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'color', 'status', 'actions'];
  readonly rows = computed(() => this.store.items());

  ngOnInit(): void {
    void this.store.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(OrganizationFormDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: {},
    });
    ref.afterClosed().subscribe((created) => {
      if (created) void this.store.load();
    });
  }

  openEdit(tenant: TenantResponse): void {
    const ref = this.dialog.open(OrganizationFormDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { tenant },
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) void this.store.load();
    });
  }

  confirmDelete(tenant: TenantResponse): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Eliminar organización',
        message: `¿Estás seguro de que deseas eliminar "${tenant.name}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) void this.store.remove(tenant.id);
    });
  }
}
