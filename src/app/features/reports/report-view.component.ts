import {
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { BranchContextStore } from '@core/stores/branch-context.store';
import { ReportsService } from '@core/services/reports.service';
import { downloadBlob } from '@core/utils/file-download';
import { Role } from '@core/models/role.model';
import {
  ReportCell,
  ReportColumn,
  ReportFilters,
  ReportFormat,
  ReportResult,
} from '@core/models/report.model';
import {
  REPORTS_ACCENT,
  REPORTS_BASE_PATH,
  findReportBySlug,
} from '@core/reports/report-catalog';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

type DatePreset = 'today' | 'week' | 'month' | 'lastMonth' | 'quarter' | 'custom';

interface PresetOption {
  key: DatePreset;
  label: string;
}

@Component({
  selector: 'app-report-view-page',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    KpiCardComponent,
    AlertBannerComponent,
  ],
  templateUrl: './report-view.component.html',
  styleUrl: './report-view.component.scss',
})
export class ReportViewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);
  private readonly reportsService = inject(ReportsService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly branchContext = inject(BranchContextStore);

  readonly presets: PresetOption[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Últimos 7 días' },
    { key: 'month', label: 'Este mes' },
    { key: 'lastMonth', label: 'Mes pasado' },
    { key: 'quarter', label: 'Últimos 90 días' },
  ];

  private readonly role = computed<Role>(() => {
    if (this.authStore.isSuperAdmin()) return 'SUPER_ADMIN';
    if (this.authStore.isClinicAdmin()) return 'CLINIC_ADMIN';
    if (this.authStore.isDoctor()) return 'DOCTOR';
    if (this.authStore.isAssistant()) return 'ASSISTANT';
    if (this.authStore.isReceptionist()) return 'RECEPTIONIST';
    return 'PATIENT';
  });

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly slug = computed(() => this.paramMap().get('slug') ?? '');
  readonly definition = computed(() => findReportBySlug(this.role(), this.slug()));
  readonly accent = computed(() => REPORTS_ACCENT[this.role()]);
  readonly hubRoute = computed(() => REPORTS_BASE_PATH[this.role()]);
  readonly usesBranch = computed(() => this.definition()?.filters.includes('branch') ?? false);

  readonly preset = signal<DatePreset>('month');
  readonly from = signal<string>('');
  readonly to = signal<string>('');
  readonly branchId = signal<number | null>(null);

  readonly result = signal<ReportResult | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly exporting = signal<ReportFormat | null>(null);

  constructor() {
    const range = this.computeRange('month');
    this.from.set(range.from);
    this.to.set(range.to);

    effect(() => {
      if (this.usesBranch() && !this.branchContext.ready() && isPlatformBrowser(this.platformId)) {
        untracked(() => void this.branchContext.init());
      }
    });

    effect(() => {
      const definition = this.definition();
      if (!definition || !isPlatformBrowser(this.platformId)) return;
      untracked(() => void this.generate());
    });
  }

  applyPreset(preset: DatePreset): void {
    this.preset.set(preset);
    if (preset === 'custom') return;
    const range = this.computeRange(preset);
    this.from.set(range.from);
    this.to.set(range.to);
    void this.generate();
  }

  onFromChange(value: string): void {
    this.preset.set('custom');
    this.from.set(value);
  }

  onToChange(value: string): void {
    this.preset.set('custom');
    this.to.set(value);
  }

  selectBranch(value: string): void {
    this.branchId.set(value === '' ? null : Number(value));
    void this.generate();
  }

  async generate(): Promise<void> {
    const definition = this.definition();
    if (!definition || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const response = await firstValueFrom(
        this.reportsService.getReport(definition.key, this.buildFilters()),
      );
      this.result.set(response.data);
    } catch {
      this.result.set(null);
      this.errorMessage.set('No pudimos generar el reporte. Intenta nuevamente en unos minutos.');
    } finally {
      this.loading.set(false);
    }
  }

  async exportAs(format: ReportFormat): Promise<void> {
    const definition = this.definition();
    if (!definition || this.exporting() || !isPlatformBrowser(this.platformId)) return;
    this.exporting.set(format);
    try {
      const blob = await firstValueFrom(
        this.reportsService.exportReport(definition.key, format, this.buildFilters()),
      );
      const extension = format === 'PDF' ? 'pdf' : 'xlsx';
      downloadBlob(blob, `${definition.slug}-${this.from()}-${this.to()}.${extension}`);
    } catch {
      this.errorMessage.set('No pudimos descargar el archivo. Intenta nuevamente.');
    } finally {
      this.exporting.set(null);
    }
  }

  formatCell(value: ReportCell, column: ReportColumn): string {
    if (value === null || value === '') return '—';
    switch (column.format) {
      case 'currency':
        return this.formatCurrency(value);
      case 'percent':
        return `${value}%`;
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('es-PE') : String(value);
      default:
        return String(value);
    }
  }

  barWidth(value: number, bars: { value: number }[]): number {
    const max = Math.max(...bars.map((bar) => bar.value), 1);
    return Math.round((value / max) * 100);
  }

  private buildFilters(): ReportFilters {
    return {
      from: this.from(),
      to: this.to(),
      branchId: this.usesBranch() ? this.branchId() : null,
    };
  }

  private formatCurrency(value: ReportCell): string {
    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(amount)) return String(value);
    return amount.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
  }

  private computeRange(preset: DatePreset): { from: string; to: string } {
    const today = new Date();
    const iso = (date: Date): string => date.toISOString().slice(0, 10);

    if (preset === 'today') {
      return { from: iso(today), to: iso(today) };
    }
    if (preset === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { from: iso(start), to: iso(today) };
    }
    if (preset === 'quarter') {
      const start = new Date(today);
      start.setDate(today.getDate() - 89);
      return { from: iso(start), to: iso(today) };
    }
    if (preset === 'lastMonth') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: iso(start), to: iso(end) };
    }
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: iso(start), to: iso(today) };
  }
}
