import { Component, OnInit, inject, computed, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  CdkDropList,
  CdkDrag,
  CdkDropListGroup,
  CdkDragPlaceholder,
  CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { QueueStore, QueuePatient, QueueColumnId } from '@core/stores/queue.store';
import { BranchContextStore } from '@core/stores/branch-context.store';
import { AppointmentFlowStatus } from '@core/models/appointment.model';

type DetailMode = 'view' | 'cancel' | 'reschedule';

@Component({
  selector: 'app-queue-page',
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    CdkDropList,
    CdkDrag,
    CdkDropListGroup,
    CdkDragPlaceholder,
    AlertBannerComponent,
  ],
  templateUrl: './queue-page.component.html',
  styleUrl: './queue-page.component.scss',
})
export class QueuePageComponent implements OnInit {
  readonly store = inject(QueueStore);
  readonly branchContext = inject(BranchContextStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');
  readonly detailMode = signal<DetailMode>('view');
  readonly cancelReason = signal('');
  readonly reschedDate = signal('');
  readonly reschedTime = signal('');

  readonly clock = computed(() => this.fmtTime(new Date(this.store.currentTime())));

  readonly todayLabel = computed(() => {
    const d = new Date(this.store.currentTime());
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d);
    return `${weekday} ${day} de ${month}`;
  });

  readonly lastRefreshLabel = computed(() => {
    const diff = Math.max(0, Math.floor((this.store.currentTime() - this.store.lastRefreshAt()) / 1000));
    if (diff < 5) return 'actualizado ahora';
    if (diff < 60) return `hace ${diff}s`;
    return `hace ${Math.floor(diff / 60)} min`;
  });

  readonly enterPredicate = (_drag: CdkDrag, drop: CdkDropList): boolean => drop.id !== 'toArrive';

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.loadInit();
    interval(15_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.tick();
        void this.store.refresh();
      });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.store.setSearch(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.store.setSearch('');
  }

  onDrop(event: CdkDragDrop<QueuePatient[]>, target: QueueColumnId): void {
    if (event.previousContainer === event.container) return;
    const patient = event.item.data as QueuePatient;
    void this.store.moveTo(patient.id, target);
  }

  private readonly nextFlow: Partial<Record<QueueColumnId, AppointmentFlowStatus>> = {
    toArrive: 'WAITING',
    waiting: 'CALLED',
    called: 'IN_PROCESS',
    inConsult: 'PENDING_PAYMENT',
    toBill: 'COMPLETED',
  };

  advance(patient: QueuePatient, event?: Event): void {
    event?.stopPropagation();
    const next = this.nextFlow[patient.column];
    if (next) void this.store.setFlow(patient.id, next);
  }

  advanceLabel(column: QueueColumnId): string | null {
    const labels: Partial<Record<QueueColumnId, string>> = {
      toArrive: 'Registró llegada',
      waiting: 'Llamar',
      called: 'Pasó a consulta',
      inConsult: 'Finalizar consulta',
      toBill: 'Registrar pago',
    };
    return labels[column] ?? null;
  }

  advanceIcon(column: QueueColumnId): string {
    const icons: Partial<Record<QueueColumnId, string>> = {
      toArrive: 'login',
      waiting: 'campaign',
      called: 'meeting_room',
      inConsult: 'check_circle',
      toBill: 'paid',
    };
    return icons[column] ?? 'task_alt';
  }

  openDetail(patient: QueuePatient): void {
    this.detailMode.set('view');
    this.store.select(patient.id);
  }

  closeDetail(): void {
    this.detailMode.set('view');
    this.store.clearSelection();
  }

  beginCancel(): void {
    this.cancelReason.set('');
    this.detailMode.set('cancel');
  }

  beginReschedule(patient: QueuePatient): void {
    const d = new Date(patient.scheduledAt);
    this.reschedDate.set(this.toDateInput(d));
    this.reschedTime.set(this.fmtTime(d));
    this.detailMode.set('reschedule');
  }

  backToView(): void {
    this.detailMode.set('view');
  }

  onCancelReason(event: Event): void {
    this.cancelReason.set((event.target as HTMLTextAreaElement).value);
  }

  onReschedDate(event: Event): void {
    this.reschedDate.set((event.target as HTMLInputElement).value);
  }

  onReschedTime(event: Event): void {
    this.reschedTime.set((event.target as HTMLInputElement).value);
  }

  async confirmCancel(patient: QueuePatient): Promise<void> {
    const reason = this.cancelReason().trim();
    if (!reason) return;
    const ok = await this.store.cancelAppointment(patient.id, reason);
    if (ok) this.closeDetail();
  }

  async confirmReschedule(patient: QueuePatient): Promise<void> {
    const date = this.reschedDate();
    const time = this.reschedTime();
    if (!date || !time) return;
    const ok = await this.store.reschedule(patient.id, `${date}T${time}:00`);
    if (ok) this.closeDetail();
  }

  openNewAppointment(): void {
    void this.router.navigate(['/reception/appointments/new']);
  }

  openWalkIn(): void {
    void this.router.navigate(['/reception/appointments/new'], { queryParams: { walkIn: true } });
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  shortDoctor(fullName: string): string {
    const parts = fullName.replace(/^Dr[a]?\.\s*/i, '').split(' ');
    return parts[0] ?? fullName;
  }

  fmtTime(d: Date): string {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  fmtIso(iso: string): string {
    return this.fmtTime(new Date(iso));
  }

  endTimeLabel(patient: QueuePatient): string {
    const end = new Date(new Date(patient.scheduledAt).getTime() + (patient.durationMinutes ?? 30) * 60_000);
    return this.fmtTime(end);
  }

  visualStateLabel(state: QueuePatient['visualState']): string {
    const labels: Record<QueuePatient['visualState'], string> = {
      'scheduled': 'Por llegar',
      'waiting': 'En sala de espera',
      'called': 'Llamado',
      'in-process': 'En consulta',
      'pending-payment': 'Por cobrar',
      'completed': 'Finalizada',
      'no-show': 'No se presentó',
      'cancelled': 'Cancelada',
    };
    return labels[state];
  }

  elapsedLabel(patient: QueuePatient): string {
    const labels: Partial<Record<QueueColumnId, string>> = {
      waiting: 'min esperando',
      called: 'min desde el llamado',
      inConsult: 'min en consulta',
      toBill: 'min sin cobrar',
    };
    return labels[patient.column] ?? 'min';
  }

  amountLabel(patient: QueuePatient): string | null {
    if (patient.amount == null) return null;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(patient.amount);
  }

  sourceLabel(patient: QueuePatient): string {
    const labels: Record<string, string> = {
      'SELF': 'Auto-agendada',
      'PHONE': 'Telefónica',
      'IN_PERSON': 'Presencial',
    };
    return patient.bookingSource ? (labels[patient.bookingSource] ?? patient.bookingSource) : 'Recepción';
  }

  toDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
