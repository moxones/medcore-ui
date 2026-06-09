import { Component, computed, inject } from '@angular/core';
import { AuthStore } from '@core/auth/auth.store';
import { Role } from '@core/models/role.model';
import {
  ReportsHubComponent as ReportsHubView,
  ReportLink,
} from '@shared/components/reports-hub/reports-hub.component';
import {
  REPORTS_ACCENT,
  REPORTS_BASE_PATH,
  REPORTS_SUBTITLE,
  REPORTS_TITLE,
  REPORT_CATALOG,
} from '@core/reports/report-catalog';

@Component({
  selector: 'app-reports-hub-page',
  standalone: true,
  imports: [ReportsHubView],
  template: `
    <app-reports-hub
      [accent]="accent()"
      breadcrumb="reportes"
      [title]="title()"
      [subtitle]="subtitle()"
      [reports]="reports()" />
  `,
})
export class ReportsHubPageComponent {
  private readonly authStore = inject(AuthStore);

  private readonly role = computed<Role>(() => {
    if (this.authStore.isSuperAdmin()) return 'SUPER_ADMIN';
    if (this.authStore.isClinicAdmin()) return 'CLINIC_ADMIN';
    if (this.authStore.isDoctor()) return 'DOCTOR';
    if (this.authStore.isAssistant()) return 'ASSISTANT';
    if (this.authStore.isReceptionist()) return 'RECEPTIONIST';
    return 'PATIENT';
  });

  readonly accent = computed(() => REPORTS_ACCENT[this.role()]);
  readonly title = computed(() => REPORTS_TITLE[this.role()]);
  readonly subtitle = computed(() => REPORTS_SUBTITLE[this.role()]);

  readonly reports = computed<ReportLink[]>(() => {
    const base = REPORTS_BASE_PATH[this.role()];
    return REPORT_CATALOG[this.role()].map((report) => ({
      icon: report.icon,
      title: report.title,
      description: report.description,
      route: `${base}/${report.slug}`,
    }));
  });
}
