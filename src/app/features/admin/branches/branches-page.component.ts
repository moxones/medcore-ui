import { Component, OnInit, inject, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BranchStore } from '@core/stores/branch.store';
import { BranchFormDialogComponent } from '@shared/dialogs/branch-form/branch-form-dialog.component';

@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './branches-page.component.html',
  styleUrl: './branches-page.component.scss',
})
export class BranchesPageComponent implements OnInit {
  readonly store = inject(BranchStore);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'duration', 'actions'];

  readonly rows = computed(() => this.store.page()?.content ?? []);
  readonly totalElements = computed(() => this.store.page()?.totalElements ?? 0);
  readonly pageSize = computed(() => this.store.page()?.pageSize ?? 15);
  readonly pageIndex = computed(() => this.store.page()?.pageNumber ?? 0);

  ngOnInit(): void {
    void this.store.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(BranchFormDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((created) => {
      if (created) void this.store.load();
    });
  }

  onPage(event: PageEvent): void {
    void this.store.load({ page: event.pageIndex, size: event.pageSize });
  }
}
