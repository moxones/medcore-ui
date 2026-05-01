import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientStore } from '@core/stores/patient.store';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss',
})
export class PatientsPageComponent implements OnInit {
  readonly store = inject(PatientStore);

  readonly displayedColumns = ['name', 'email', 'actions'];
  readonly searchControl = new FormControl('');

  readonly rows = computed(() => this.store.page()?.content ?? []);
  readonly totalElements = computed(() => this.store.page()?.totalElements ?? 0);
  readonly pageSize = computed(() => this.store.page()?.pageSize ?? 15);
  readonly pageIndex = computed(() => this.store.page()?.pageNumber ?? 0);

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe((query) => {
      if (query && query.trim().length >= 2) {
        void this.store.search(query.trim());
      } else if (!query || query.trim() === '') {
        void this.store.load({ page: 0 });
      }
    });
  }

  ngOnInit(): void {
    void this.store.load();
  }

  onPage(event: PageEvent): void {
    void this.store.load({ page: event.pageIndex, size: event.pageSize });
  }

  fullName(row: { firstName: string; lastName: string }): string {
    return `${row.firstName} ${row.lastName}`;
  }
}
