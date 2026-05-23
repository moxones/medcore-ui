import { Component, OnInit, inject, computed, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgendaStore, EnrichedAppointment, DoctorColumn, VisualState, GRID_START_H, PX_PER_MIN } from '@core/stores/agenda.store';

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss',
})
export class AgendaPageComponent implements OnInit {
  readonly store = inject(AgendaStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');

  readonly formattedDate = computed(() => {
    const d = new Date(this.store.date() + 'T12:00:00');
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d);
    const year = d.getFullYear();
    return `${weekday.replace('.', '')} ${day} de ${month} ${year}`;
  });

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

  readonly visibleColumns = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.store.doctorColumns();
    return this.store.doctorColumns().map((col) => ({
      ...col,
      appointments: col.appointments.filter((a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.typeName.toLowerCase().includes(q)
      ),
    })).filter((col) => col.appointments.length > 0);
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

  prevDay(): void {
    const d = new Date(this.store.date() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    this.store.setDate(d.toISOString().split('T')[0]);
  }

  nextDay(): void {
    const d = new Date(this.store.date() + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    this.store.setDate(d.toISOString().split('T')[0]);
  }

  goToday(): void {
    this.store.setDate(new Date().toISOString().split('T')[0]);
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
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onCardClick(appt: EnrichedAppointment): void {
    if (appt.visualState === 'scheduled') {
      void this.store.updateFlowStatus(appt.id, 'WAITING');
    }
  }

  setInProcess(appt: EnrichedAppointment): void {
    void this.store.updateFlowStatus(appt.id, 'IN_PROCESS');
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

}
