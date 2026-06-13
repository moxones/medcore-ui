import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProcessConfigService } from '../services/process-config.service';
import {
  ClinicProcess,
  ProcessConfig,
  DEFAULT_PROCESS_CONFIG,
} from '../models/process-config.model';

interface ProcessConfigState {
  config: ProcessConfig;
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const ProcessConfigStore = signalStore(
  { providedIn: 'root' },
  withState<ProcessConfigState>({
    config: { ...DEFAULT_PROCESS_CONFIG },
    loaded: false,
    loading: false,
    saving: false,
    error: null,
  }),
  withComputed(({ config }) => ({
    triageEnabled: computed(() => config().TRIAGE),
    paymentEnabled: computed(() => config().PAYMENT),
    calledEnabled: computed(() => config().CALLED),
    activeCount: computed(
      () => Object.values(config()).filter(Boolean).length,
    ),
  })),
  withMethods((store, service = inject(ProcessConfigService)) => ({
    async load(force = false): Promise<void> {
      if (store.loaded() && !force) return;
      patchState(store, { loading: true, error: null });
      try {
        const res = await firstValueFrom(service.get());
        patchState(store, { config: res.data, loaded: true, loading: false });
      } catch {
        patchState(store, {
          config: { ...DEFAULT_PROCESS_CONFIG },
          loaded: true,
          loading: false,
          error: 'No se pudo cargar la configuración de procesos.',
        });
      }
    },

    async save(processes: Partial<ProcessConfig>): Promise<boolean> {
      patchState(store, { saving: true, error: null });
      try {
        const res = await firstValueFrom(service.update({ processes }));
        patchState(store, { config: res.data, loaded: true, saving: false });
        return true;
      } catch {
        patchState(store, {
          saving: false,
          error: 'No se pudo guardar la configuración. Intenta de nuevo.',
        });
        return false;
      }
    },

    isEnabled(process: ClinicProcess): boolean {
      return store.config()[process];
    },
  })),
);
