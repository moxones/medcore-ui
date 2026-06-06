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
import { Router, RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { DashboardHeroComponent } from '@shared/components/dashboard/dashboard-hero/dashboard-hero.component';
import { DashboardPanelComponent } from '@shared/components/dashboard/dashboard-panel/dashboard-panel.component';
import { QuickActionsComponent, QuickAction } from '@shared/components/dashboard/quick-actions/quick-actions.component';
import { AuthStore } from '@core/auth/auth.store';
import { TriageStore } from '@core/stores/triage.store';
import { TriageSummaryResponse, UrgencyLevel } from '@core/models/triage.model';
import { urgencyKey, urgencyLabel } from '@core/utils/triage-vitals.util';

@Component({
  selector: 'app-assistant-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    KpiCardComponent,
    DashboardHeroComponent,
    DashboardPanelComponent,
    QuickActionsComponent,
  ],
  templateUrl: './assistant-dashboard.component.html',
  styleUrl: './assistant-dashboard.component.scss',
})
export class AssistantDashboardComponent implements OnInit {
  readonly store = inject(TriageStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly greeting = signal(this.resolveGreeting());

  readonly quickLinks: QuickAction[] = [
    {
      icon: 'pending_actions',
      label: 'Cola de Triaje',
      description: 'Atender pacientes en espera',
      route: '/assistant/triage',
      accent: 'orange',
    },
    {
      icon: 'fact_check',
      label: 'Triajes de Hoy',
      description: 'Historial del día',
      route: '/assistant/history',
      accent: 'green',
    },
    {
      icon: 'people',
      label: 'Pacientes',
      description: 'Buscar pacientes',
      route: '/assistant/patients',
      accent: 'purple',
    },
  ];

  readonly clock = computed(() => this.fmtTime(new Date(this.store.currentTime())));

  readonly todayLabel = computed(() => {
    const d = new Date(this.store.currentTime());
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d);
    return `${weekday} ${day} de ${month}`;
  });

  readonly priorityCount = computed(() => this.store.triageStats().critical + this.store.triageStats().urgent);

  readonly recent = computed(() => this.store.recentTriages().slice(0, 6));

  readonly busiestLoad = computed(() => {
    const list = this.store.byDoctor();
    return list.length ? Math.max(...list.map((d) => d.pending + d.triaged + d.scheduled)) : 0;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.loadInit();
    void this.store.loadTodayTriages();
    interval(20_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.tick();
        void this.store.refresh();
        void this.store.loadTodayTriages();
      });
  }

  goToQueue(): void {
    void this.router.navigate(['/assistant/triage']);
  }

  attendNext(): void {
    void this.router.navigate(['/assistant/triage']);
  }

  loadPercent(triage: { pending: number; triaged: number; scheduled: number }): number {
    const max = this.busiestLoad();
    if (max <= 0) return 0;
    return Math.round(((triage.pending + triage.triaged + triage.scheduled) / max) * 100);
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

  private resolveGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
