import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { KpiVariant } from '@shared/widgets/kpi-card/kpi-card.component';

@Component({
  selector: 'app-dashboard-panel',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './dashboard-panel.component.html',
  styleUrl: './dashboard-panel.component.scss',
})
export class DashboardPanelComponent {
  icon = input('');
  iconVariant = input<KpiVariant>('blue');
  title = input.required<string>();
  badge = input<string | number | null>(null);
}
