import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export type ReportsAccent = 'doctor' | 'assistant' | 'primary';

export interface ReportLink {
  icon: string;
  title: string;
  description: string;
  route: string;
  metric?: string;
}

@Component({
  selector: 'app-reports-hub',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './reports-hub.component.html',
  styleUrl: './reports-hub.component.scss',
})
export class ReportsHubComponent {
  readonly accent = input<ReportsAccent>('primary');
  readonly breadcrumb = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly reports = input<ReportLink[]>([]);
}
