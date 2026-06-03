import { Component, OnInit, inject, computed, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { AgendaStore, EnrichedAppointment, PackedAppointment, DoctorColumn, VisualState, AgendaView, GRID_START_H, PX_PER_MIN } from '@core/stores/agenda.store';

type DetailMode = 'view' | 'cancel' | 'reschedule';

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule, MatTooltipModule, AlertBannerComponent],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss',
})
export class AgendaPageComponent implements OnInit {
  readonly store = inject(AgendaStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');
  readonly detailMode = signal<DetailMode>('view');
  readonly cancelReason = signal('');
  readonly reschedDate = signal('');
  readonly reschedTime = signal('');

  readonly formattedDate = computed(() => {
    const view = this.store.view();
    if (view === 'month') return this.formatMonth(this.store.date());
    if (view === 'week') return this.formatWeekRange(this.store.range().start, this.store.range().end);
    const d = new Date(this.store.date() + 'T12:00:00');
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d);
    const year = d.getFullYear();
    return `${weekday.replace('.', '')} ${day} de ${month} ${year}`;
  });

  readonly rangeCountLabel = computed(() => {
    const view = this.store.view();
    if (view === 'week') return 'semana';
    if (view === 'month') return 'mes';
    return 'hoy';
  });

  readonly showRightPanel = computed(() => this.store.view() === 'day');

  readonly viewEmpty = computed(() => {
    const view = this.store.view();
    if (view === 'week') return this.store.weekDays().every((d) => d.appointments.length === 0);
    if (view === 'month') return false;
    return this.store.doctorColumns().length === 0;
  });

  readonly monthWeekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  readonly next60Range = computed(() => {
    const now = new Date(this.store.currentTime());
    const in60 = new Date(now.getTime() + 3_600_000);
    return `${this.fmtTime(now)} — ${this.fmtTime(in60)}`;
  });

  readonly selectedBranchName = computed(() => {
    const id = this.store.branchId();
    return this.store.branches().find((b) => b.id === id)?.name ?? 'Sucursal';
  });

  readonly selectedDoctorName = computed(() => {
    const id = this.store.filterDoctorId();
    if (id === null) return 'todos';
    const col = this.store.doctorColumns().find((c) => c.doctorId === id);
    return col?.doctorName ?? 'todos';
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.loadInit();
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.tick();
        void this.store.refresh();
      });
  }

  prevPeriod(): void {
    this.store.goPrev();
  }

  nextPeriod(): void {
    this.store.goNext();
  }

  goToday(): void {
    this.store.goToday();
  }

  setView(view: AgendaView): void {
    this.store.setView(view);
  }

  openDay(date: string): void {
    this.store.setDate(date);
    this.store.setView('day');
  }

  selectBranch(id: number): void {
    void this.store.setBranch(id);
  }

  toggleDoctorFilter(doctorId: number): void {
    const current = this.store.filterDoctorId();
    this.store.setFilterDoctor(current === doctorId ? null : doctorId);
  }

  toggleStatusFilter(state: VisualState): void {
    const current = this.store.filterVisualState();
    this.store.setFilterVisualState(current === state ? null : state);
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

  openDetail(appt: EnrichedAppointment): void {
    this.detailMode.set('view');
    this.store.select(appt.id);
  }

  closeDetail(): void {
    this.detailMode.set('view');
    this.store.clearSelection();
  }

  quickAction(appt: EnrichedAppointment): void {
    if (appt.visualState === 'scheduled') {
      void this.store.updateFlowStatus(appt.id, 'WAITING');
      return;
    }
    if (appt.visualState === 'waiting') {
      void this.store.updateFlowStatus(appt.id, 'IN_PROCESS');
    }
  }

  setInProcess(appt: EnrichedAppointment): void {
    void this.store.updateFlowStatus(appt.id, 'IN_PROCESS');
  }

  checkIn(appt: EnrichedAppointment): void {
    void this.store.updateFlowStatus(appt.id, 'WAITING');
  }

  startConsult(appt: EnrichedAppointment): void {
    void this.store.updateFlowStatus(appt.id, 'IN_PROCESS');
  }

  completeConsult(appt: EnrichedAppointment): void {
    void this.store.updateFlowStatus(appt.id, 'COMPLETED');
  }

  beginCancel(): void {
    this.cancelReason.set('');
    this.detailMode.set('cancel');
  }

  beginReschedule(appt: EnrichedAppointment): void {
    const d = new Date(appt.scheduledAt);
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

  async confirmCancel(appt: EnrichedAppointment): Promise<void> {
    const reason = this.cancelReason().trim();
    if (!reason) return;
    const ok = await this.store.cancelAppointment(appt.id, reason);
    if (ok) this.detailMode.set('view');
  }

  async confirmReschedule(appt: EnrichedAppointment): Promise<void> {
    const date = this.reschedDate();
    const time = this.reschedTime();
    if (!date || !time) return;
    const ok = await this.store.reschedule(appt.id, `${date}T${time}:00`);
    if (ok) this.detailMode.set('view');
  }

  openNewAppointment(): void {
    void this.router.navigate(['/reception/new-appointment']);
  }

  openWalkIn(): void {
    void this.router.navigate(['/reception/new-appointment'], { queryParams: { walkIn: true } });
  }

  hourLabel(h: number): string {
    return h.toString().padStart(2, '0') + ':00';
  }

  hourTop(h: number): number {
    return (h - GRID_START_H) * 60 * PX_PER_MIN;
  }

  fmtTime(d: Date): string {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  fmtIso(iso: string): string {
    return this.fmtTime(new Date(iso));
  }

  currentTimeLabel(): string {
    return this.fmtTime(new Date(this.store.currentTime()));
  }

  formatMonth(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d);
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getFullYear()}`;
  }

  formatWeekRange(startIso: string, endIso: string): string {
    const s = new Date(startIso + 'T12:00:00');
    const e = new Date(endIso + 'T12:00:00');
    const monthOf = (dt: Date) =>
      new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(dt).replace('.', '');
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} – ${e.getDate()} ${monthOf(e)} ${e.getFullYear()}`;
    }
    return `${s.getDate()} ${monthOf(s)} – ${e.getDate()} ${monthOf(e)} ${e.getFullYear()}`;
  }

  laneLeft(appt: PackedAppointment): number {
    return (appt.laneIndex / appt.laneCount) * 100;
  }

  laneWidth(appt: PackedAppointment): number {
    return 100 / appt.laneCount;
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  shortName(fullName: string): string {
    const parts = fullName.replace(/^Dr[a]?\.\s*/i, '').split(' ');
    return parts[0] ?? fullName;
  }

  doctorAvatarColor(index: number): string {
    const colors = ['avatar-col--teal', 'avatar-col--purple', 'avatar-col--amber', 'avatar-col--rose', 'avatar-col--indigo'];
    return colors[index % colors.length];
  }

  isConsultationActive(col: DoctorColumn): boolean {
    return col.isInConsultation;
  }

  statusBadgeLabel(appt: EnrichedAppointment): string {
    const labels: Record<VisualState, string> = {
      'scheduled': '',
      'waiting': 'En sala de espera',
      'in-process': 'En curso',
      'completed': '',
      'no-show': 'No-show',
      'cancelled': 'Cancelada',
    };
    return labels[appt.visualState];
  }

  cardAction(appt: EnrichedAppointment): string | null {
    if (appt.visualState === 'scheduled') return 'Registrar llegada';
    if (appt.visualState === 'waiting') return 'Llamar al doctor';
    return null;
  }

  toDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  endTimeLabel(appt: EnrichedAppointment): string {
    const end = new Date(new Date(appt.scheduledAt).getTime() + (appt.durationMinutes ?? 30) * 60_000);
    return this.fmtTime(end);
  }

  visualStateLabel(state: VisualState): string {
    const labels: Record<VisualState, string> = {
      'scheduled': 'Confirmada',
      'waiting': 'En sala de espera',
      'in-process': 'En consulta',
      'completed': 'Terminada',
      'no-show': 'No se presentó',
      'cancelled': 'Cancelada',
    };
    return labels[state];
  }

  sourceLabel(appt: EnrichedAppointment): string {
    const labels: Record<string, string> = {
      'SELF': 'Auto-agendada',
      'PHONE': 'Telefónica',
      'IN_PERSON': 'Presencial',
    };
    return appt.bookingSource ? (labels[appt.bookingSource] ?? appt.bookingSource) : 'Recepción';
  }

}
