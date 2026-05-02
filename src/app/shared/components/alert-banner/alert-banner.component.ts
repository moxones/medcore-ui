import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (message()) {
      <div class="alert-banner">
        <mat-icon>error_outline</mat-icon>
        <span>{{ message() }}</span>
      </div>
    }
  `,
  styles: [`
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      color: var(--color-danger);
      font-size: 13px;
    }
    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
  `],
})
export class AlertBannerComponent {
  readonly message = input<string | null>(null);
}
