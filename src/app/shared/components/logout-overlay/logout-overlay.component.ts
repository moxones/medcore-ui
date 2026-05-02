import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@core/auth/auth.store';

@Component({
  selector: 'app-logout-overlay',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (authStore.loggingOut()) {
      <div class="overlay">
        <div class="overlay-card">
          <mat-spinner diameter="40" />
          <span class="overlay-label">Cerrando sesión...</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: wait;
    }
    .overlay-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 32px 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
    }
    .overlay-label {
      font-size: 15px;
      font-weight: 500;
      color: #374151;
      letter-spacing: -0.1px;
    }
  `],
})
export class LogoutOverlayComponent {
  readonly authStore = inject(AuthStore);
}
