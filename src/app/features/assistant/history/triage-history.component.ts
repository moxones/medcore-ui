import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TriageStore } from '@core/stores/triage.store';
import { BranchContextStore } from '@core/stores/branch-context.store';
import { TriageSummaryResponse, UrgencyLevel } from '@core/models/triage.model';
import { computeImc, urgencyKey, urgencyLabel } from '@core/utils/triage-vitals.util';

interface UrgencyFilter {
  level: UrgencyLevel | null;
  label: string;
}

@Component({
  selector: 'app-triage-history',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressBarModule],
  templateUrl: './triage-history.component.html',
  styleUrl: './triage-history.component.scss',
})
export class TriageHistoryComponent implements OnInit {
  readonly store = inject(TriageStore);
  readonly branchContext = inject(BranchContextStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');
  readonly doctorFilter = signal<number | null>(null);
  readonly urgencyFilter = signal<UrgencyLevel | null>(null);
  readonly expandedId = signal<number | null>(null);

  readonly urgencyFilters: UrgencyFilter[] = [
    { level: null, label: 'Todas' },
    { level: 'CRITICAL', label: 'Críticas' },
    { level: 'URGENT', label: 'Urgentes' },
    { level: 'NORMAL', label: 'Normales' },
  ];

  readonly doctors = computed(() => {
    const map = new Map<number, string>();
    for (const t of this.store.todayTriages()) map.set(t.doctorId, t.doctorName);
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly visible = computed((): TriageSummaryResponse[] => {
    const term = this.searchQuery().toLowerCase().trim();
    const doctorId = this.doctorFilter();
    const urgency = this.urgencyFilter();
    return this.store
      .recentTriages()
      .filter((t) => {
        if (doctorId !== null && t.doctorId !== doctorId) return false;
        if (urgency !== null && t.urgencyLevel !== urgency) return false;
        if (term && !`${t.patientName} ${t.doctorName} ${t.appointmentTypeName ?? ''}`.toLowerCase().includes(term)) {
          return false;
        }
        return true;
      });
  });

  readonly counts = computed(() => {
    const list = this.store.todayTriages();
    return {
      total: list.length,
      critical: list.filter((t) => t.urgencyLevel === 'CRITICAL').length,
      urgent: list.filter((t) => t.urgencyLevel === 'URGENT').length,
      normal: list.filter((t) => t.urgencyLevel === 'NORMAL').length,
    };
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.loadInit();
    void this.store.loadTodayTriages();
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.tick();
        void this.store.loadTodayTriages();
      });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  selectDoctor(id: number | null): void {
    this.doctorFilter.set(id);
  }

  selectUrgency(level: UrgencyLevel | null): void {
    this.urgencyFilter.set(level);
  }

  toggleExpand(id: number): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  imcValue(triage: TriageSummaryResponse): number | null {
    return computeImc(triage.weight, triage.height)?.value ?? null;
  }

  urgencyKeyOf(level: UrgencyLevel): 'normal' | 'urgent' | 'critical' {
    return urgencyKey(level);
  }

  urgencyText(level: UrgencyLevel): string {
    return urgencyLabel(level);
  }

  patientInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  shortDoctor(name: string): string {
    const clean = name.replace(/^Dr[a]?\.\s*/i, '').trim();
    return clean.split(' ').slice(0, 2).join(' ') || name;
  }

  triageTime(triage: TriageSummaryResponse): string {
    return this.fmtTime(new Date(triage.createdAt));
  }

  private fmtTime(d: Date): string {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }
}
