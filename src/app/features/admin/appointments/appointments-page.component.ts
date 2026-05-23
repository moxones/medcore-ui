import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AppointmentStore } from '@core/stores/appointment.store';
import { AppointmentFlowStatus } from '@core/models/appointment.model';

interface StatusOption {
  label: string;
  value: AppointmentFlowStatus | '';
  cssClass: string;
}

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss',
})
export class AppointmentsPageComponent implements OnInit {
  readonly store = inject(AppointmentStore);

  readonly displayedColumns = ['patient', 'doctor', 'branch', 'scheduledAt', 'status', 'actions'];

  readonly dateControl = new FormControl<Date | null>(null);
  readonly statusControl = new FormControl<AppointmentFlowStatus | ''>('');

  readonly statusOptions: StatusOption[] = [
    { label: 'Todos', value: '', cssClass: '' },
    { label: 'En espera', value: 'WAITING', cssClass: 'chip--warning' },
    { label: 'En consulta', value: 'IN_PROCESS', cssClass: 'chip--primary' },
    { label: 'Completada', value: 'COMPLETED', cssClass: 'chip--success' },
  ];

  readonly activeStatus = signal<AppointmentFlowStatus | ''>('');

  readonly rows = computed(() => this.store.page()?.content ?? []);
  readonly totalElements = computed(() => this.store.page()?.totalElements ?? 0);
  readonly pageSize = computed(() => this.store.page()?.pageSize ?? 15);
  readonly pageIndex = computed(() => this.store.page()?.pageNumber ?? 0);

  ngOnInit(): void {
    void this.store.load();
  }

  applyStatusFilter(status: AppointmentFlowStatus | ''): void {
    this.activeStatus.set(status);
    void this.store.load({
      page: 0,
      statusId: status ? this.statusToId(status) : undefined,
      date: this.formatDate(this.dateControl.value),
    });
  }

  applyDateFilter(): void {
    void this.store.load({
      page: 0,
      date: this.formatDate(this.dateControl.value),
      statusId: this.activeStatus() ? this.statusToId(this.activeStatus() as AppointmentFlowStatus) : undefined,
    });
  }

  clearFilters(): void {
    this.dateControl.setValue(null);
    this.activeStatus.set('');
    void this.store.load({ page: 0, statusId: undefined, date: undefined });
  }

  onPage(event: PageEvent): void {
    void this.store.load({
      page: event.pageIndex,
      size: event.pageSize,
    });
  }

  statusLabel(status: AppointmentFlowStatus): string {
    const map: Record<AppointmentFlowStatus, string> = {
      WAITING: 'En espera',
      IN_PROCESS: 'En consulta',
      COMPLETED: 'Completada',
    };
    return map[status] ?? status;
  }

  statusClass(status: AppointmentFlowStatus): string {
    const map: Record<AppointmentFlowStatus, string> = {
      WAITING: 'chip--warning',
      IN_PROCESS: 'chip--primary',
      COMPLETED: 'chip--success',
    };
    return map[status] ?? '';
  }

  formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  }

  private formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    return date.toISOString().slice(0, 10);
  }

  private statusToId(status: AppointmentFlowStatus): number {
    const map: Record<AppointmentFlowStatus, number> = {
      WAITING: 1,
      IN_PROCESS: 2,
      COMPLETED: 3,
    };
    return map[status];
  }
}
