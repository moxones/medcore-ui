import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-process-disabled-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="disabled-state">
      <div class="disabled-state__icon">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <h2 class="disabled-state__title">{{ title() }}</h2>
      <p class="disabled-state__message">{{ message() }}</p>
      <div class="disabled-state__hint">
        <mat-icon>admin_panel_settings</mat-icon>
        <span>Solicita a un administrador que active este proceso en Configuración de Colas.</span>
      </div>
    </div>
  `,
  styles: [`
    .disabled-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      max-width: 460px;
      margin: 48px auto;
      padding: 48px 28px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 18px;
      box-shadow: var(--elevation-1);
    }
    .disabled-state__icon {
      display: grid;
      place-items: center;
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      color: var(--mat-sys-primary);
    }
    .disabled-state__icon mat-icon {
      font-size: 34px;
      width: 34px;
      height: 34px;
    }
    .disabled-state__title {
      font-size: 19px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }
    .disabled-state__message {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0;
      line-height: 1.5;
    }
    .disabled-state__hint {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      padding: 10px 14px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent);
      color: var(--color-text-secondary);
      font-size: 12.5px;
      line-height: 1.4;
      text-align: left;
    }
    .disabled-state__hint mat-icon {
      font-size: 19px;
      width: 19px;
      height: 19px;
      flex-shrink: 0;
      color: var(--mat-sys-primary);
    }
  `],
})
export class ProcessDisabledStateComponent {
  readonly icon = input('lock');
  readonly title = input('Función no disponible');
  readonly message = input('Este proceso no está habilitado para tu clínica.');
}
