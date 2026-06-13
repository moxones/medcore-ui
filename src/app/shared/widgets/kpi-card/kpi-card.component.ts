import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type KpiVariant = 'blue' | 'green' | 'orange' | 'purple' | 'red';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  host: {
    '[class]': "'kpi kpi--' + variant()",
  },
})
export class KpiCardComponent {
  icon = input.required<string>();
  label = input.required<string>();
  value = input.required<string>();
  hint = input<string | null>(null);
  loading = input(false);
  variant = input<KpiVariant>('blue');
}
