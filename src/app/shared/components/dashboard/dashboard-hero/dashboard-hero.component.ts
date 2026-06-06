import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard-hero.component.html',
  styleUrl: './dashboard-hero.component.scss',
})
export class DashboardHeroComponent {
  greeting = input<string | null | undefined>('');
  name = input<string | null | undefined>('');
  title = input<string | null | undefined>('');
  subtitle = input<string | null | undefined>('');
  dateLabel = input<string | null | undefined>('');
}
