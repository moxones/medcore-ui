import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { KpiVariant } from '@shared/widgets/kpi-card/kpi-card.component';

export interface QuickAction {
  icon: string;
  label: string;
  description?: string;
  route: string;
  accent: KpiVariant;
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
})
export class QuickActionsComponent {
  title = input('Accesos rápidos');
  icon = input('grid_view');
  links = input.required<QuickAction[]>();
}
