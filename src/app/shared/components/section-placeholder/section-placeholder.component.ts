import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type PlaceholderAccent = 'doctor' | 'assistant' | 'primary';

export interface PlaceholderSection {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-section-placeholder',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './section-placeholder.component.html',
  styleUrl: './section-placeholder.component.scss',
})
export class SectionPlaceholderComponent {
  readonly accent = input<PlaceholderAccent>('primary');
  readonly icon = input.required<string>();
  readonly breadcrumb = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly sections = input<PlaceholderSection[]>([]);
}
