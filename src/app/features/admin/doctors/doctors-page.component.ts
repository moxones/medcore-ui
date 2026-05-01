import { Component, OnInit, inject, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DoctorStore } from '@core/stores/doctor.store';
import { DoctorFormDialogComponent } from '@shared/dialogs/doctor-form/doctor-form-dialog.component';

@Component({
  selector: 'app-doctors-page',
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
  templateUrl: './doctors-page.component.html',
  styleUrl: './doctors-page.component.scss',
})
export class DoctorsPageComponent implements OnInit {
  readonly store = inject(DoctorStore);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'license', 'phone', 'actions'];

  readonly rows = computed(() => this.store.page()?.content ?? []);
  readonly totalElements = computed(() => this.store.page()?.totalElements ?? 0);
  readonly pageSize = computed(() => this.store.page()?.pageSize ?? 15);
  readonly pageIndex = computed(() => this.store.page()?.pageNumber ?? 0);

  ngOnInit(): void {
    void this.store.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(DoctorFormDialogComponent, {
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

  fullName(person: { firstName: string; lastName: string }): string {
    return `${person.firstName} ${person.lastName}`;
  }
}
