import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProcessConfigStore } from '@core/stores/process-config.store';
import { ClinicProcess, ProcessConfig } from '@core/models/process-config.model';

interface ProcessCard {
  key: ClinicProcess;
  title: string;
  icon: string;
  accent: string;
  summary: string;
  whenOff: string;
}

interface FlowStep {
  label: string;
  icon: string;
  optional: boolean;
  active: boolean;
}

const PROCESS_CARDS: ProcessCard[] = [
  {
    key: 'TRIAGE',
    title: 'Triaje',
    icon: 'monitor_heart',
    accent: 'triage',
    summary: 'Toma de signos vitales antes de pasar a consulta.',
    whenOff: 'El paciente pasa de la sala de espera directo a consulta, sin registro de signos vitales.',
  },
  {
    key: 'CALLED',
    title: 'Llamado',
    icon: 'campaign',
    accent: 'called',
    summary: 'Etapa de llamado del paciente antes de ingresar a consulta.',
    whenOff: 'Se omite el botón "Llamar"; el paciente pasa de la espera directo a la consulta.',
  },
  {
    key: 'PAYMENT',
    title: 'Cobro / Caja',
    icon: 'point_of_sale',
    accent: 'payment',
    summary: 'Etapa de caja para registrar el pago al terminar la consulta.',
    whenOff: 'Al finalizar la consulta la cita se marca como completada, sin pasar por caja.',
  },
];

@Component({
  selector: 'app-queue-config-page',
  standalone: true,
  imports: [MatIconModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './queue-config-page.component.html',
  styleUrl: './queue-config-page.component.scss',
})
export class QueueConfigPageComponent implements OnInit {
  readonly store = inject(ProcessConfigStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly cards = PROCESS_CARDS;
  readonly draft = signal<ProcessConfig>({ ...this.store.config() });

  readonly dirty = computed(() => {
    const current = this.store.config();
    const next = this.draft();
    return (
      current.TRIAGE !== next.TRIAGE ||
      current.PAYMENT !== next.PAYMENT ||
      current.CALLED !== next.CALLED
    );
  });

  readonly flowSteps = computed((): FlowStep[] => {
    const d = this.draft();
    return [
      { label: 'Recepción', icon: 'how_to_reg', optional: false, active: true },
      { label: 'Triaje', icon: 'monitor_heart', optional: true, active: d.TRIAGE },
      { label: 'En espera', icon: 'hourglass_empty', optional: false, active: true },
      { label: 'Llamado', icon: 'campaign', optional: true, active: d.CALLED },
      { label: 'Consulta', icon: 'medical_services', optional: false, active: true },
      { label: 'Cobro', icon: 'point_of_sale', optional: true, active: d.PAYMENT },
      { label: 'Finalizada', icon: 'check_circle', optional: false, active: true },
    ];
  });

  ngOnInit(): void {
    void this.load();
  }

  isOn(key: ClinicProcess): boolean {
    return this.draft()[key];
  }

  toggle(key: ClinicProcess): void {
    this.draft.update((d) => ({ ...d, [key]: !d[key] }));
  }

  reset(): void {
    this.draft.set({ ...this.store.config() });
  }

  async save(): Promise<void> {
    if (!this.dirty()) return;
    const ok = await this.store.save(this.draft());
    if (ok) {
      this.draft.set({ ...this.store.config() });
      this.snackBar.open('Configuración guardada', 'OK', { duration: 2500 });
    } else {
      this.snackBar.open('No se pudo guardar. Intenta de nuevo.', 'Cerrar', { duration: 4000 });
    }
  }

  private async load(): Promise<void> {
    await this.store.load(true);
    this.draft.set({ ...this.store.config() });
  }
}
