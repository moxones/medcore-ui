import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { DoctorWorkspaceService } from '@core/services/doctor-workspace.service';
import {
  NoteTemplateResponse,
  SaveNoteTemplateRequest,
} from '@core/models/doctor-workspace.model';

interface DoctorTemplatesState {
  templates: NoteTemplateResponse[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const DoctorTemplatesStore = signalStore(
  { providedIn: 'root' },
  withState<DoctorTemplatesState>({
    templates: [],
    loading: false,
    saving: false,
    error: null,
  }),
  withComputed((store) => ({
    isEmpty: computed(() => !store.loading() && store.templates().length === 0),
  })),
  withMethods((store, service = inject(DoctorWorkspaceService)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const res = await firstValueFrom(service.getTemplates());
        patchState(store, { templates: res.data, loading: false });
      } catch {
        patchState(store, { loading: false, error: 'No se pudieron cargar tus plantillas' });
      }
    },

    async save(body: SaveNoteTemplateRequest, id: number | null): Promise<boolean> {
      patchState(store, { saving: true, error: null });
      try {
        if (id === null) {
          const res = await firstValueFrom(service.createTemplate(body));
          patchState(store, { templates: [...store.templates(), res.data], saving: false });
        } else {
          const res = await firstValueFrom(service.updateTemplate(id, body));
          patchState(store, {
            templates: store.templates().map((t) => (t.id === id ? res.data : t)),
            saving: false,
          });
        }
        return true;
      } catch {
        patchState(store, { saving: false, error: 'No se pudo guardar la plantilla' });
        return false;
      }
    },

    async remove(id: number): Promise<void> {
      patchState(store, { templates: store.templates().filter((t) => t.id !== id) });
      try {
        await firstValueFrom(service.deleteTemplate(id));
      } catch {
        patchState(store, { error: 'No se pudo eliminar la plantilla' });
        void this.load();
      }
    },
  })),
);
