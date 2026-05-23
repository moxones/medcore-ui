import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogService } from '../services/catalog.service';
import {
  AppointmentTypeMasterRequest,
  CatalogItemResponse,
  CatalogKind,
  DocumentTypeMasterRequest,
  MasterCatalogItem,
  PlanMasterRequest,
  PlanResponse,
  SpecialtyMasterRequest,
  SystemCatalogRequest,
} from '../models/catalog.model';

function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No se puede conectar al servidor. Verifica tu conexión e intenta de nuevo.';
    }
    const msg = err.error?.message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

interface CatalogState {
  specialtiesActive: CatalogItemResponse[];
  specialtiesAvailable: CatalogItemResponse[];
  appointmentTypesActive: CatalogItemResponse[];
  appointmentTypesAvailable: CatalogItemResponse[];
  documentTypesActive: CatalogItemResponse[];
  documentTypesAvailable: CatalogItemResponse[];
  plans: PlanResponse[];
  appointmentStatuses: MasterCatalogItem[];
  subscriptionStatuses: MasterCatalogItem[];
  masterSpecialties: MasterCatalogItem[];
  masterAppointmentTypes: MasterCatalogItem[];
  masterDocumentTypes: MasterCatalogItem[];
  masterPlans: PlanResponse[];
  masterSubscriptionStatuses: MasterCatalogItem[];
  masterAppointmentStatuses: MasterCatalogItem[];
  loading: boolean;
  saving: boolean;
  busyItemId: number | null;
  error: string | null;
}

const initialState: CatalogState = {
  specialtiesActive: [],
  specialtiesAvailable: [],
  appointmentTypesActive: [],
  appointmentTypesAvailable: [],
  documentTypesActive: [],
  documentTypesAvailable: [],
  plans: [],
  appointmentStatuses: [],
  subscriptionStatuses: [],
  masterSpecialties: [],
  masterAppointmentTypes: [],
  masterDocumentTypes: [],
  masterPlans: [],
  masterSubscriptionStatuses: [],
  masterAppointmentStatuses: [],
  loading: false,
  saving: false,
  busyItemId: null,
  error: null,
};

export const CatalogStore = signalStore(
  { providedIn: 'root' },
  withState<CatalogState>(initialState),
  withMethods((store, service = inject(CatalogService)) => {
    function activeKey(kind: CatalogKind): keyof CatalogState {
      if (kind === 'specialties') return 'specialtiesActive';
      if (kind === 'appointmentTypes') return 'appointmentTypesActive';
      return 'documentTypesActive';
    }

    function availableKey(kind: CatalogKind): keyof CatalogState {
      if (kind === 'specialties') return 'specialtiesAvailable';
      if (kind === 'appointmentTypes') return 'appointmentTypesAvailable';
      return 'documentTypesAvailable';
    }

    function getActivated(kind: CatalogKind) {
      if (kind === 'specialties') return service.getClinicSpecialties();
      if (kind === 'appointmentTypes') return service.getClinicAppointmentTypes();
      return service.getClinicDocumentTypes();
    }

    function getAvailable(kind: CatalogKind) {
      if (kind === 'specialties') return service.getAvailableSpecialties();
      if (kind === 'appointmentTypes') return service.getAvailableAppointmentTypes();
      return service.getAvailableDocumentTypes();
    }

    async function refreshClinic(kind: CatalogKind): Promise<void> {
      const [activated, available] = await Promise.all([
        firstValueFrom(getActivated(kind)),
        firstValueFrom(getAvailable(kind)),
      ]);
      patchState(store, {
        [activeKey(kind)]: activated.data,
        [availableKey(kind)]: available.data,
      } as Partial<CatalogState>);
    }

    async function reloadMasterSpecialties(): Promise<void> {
      const res = await firstValueFrom(service.listMasterSpecialties());
      patchState(store, { masterSpecialties: res.data });
    }

    async function reloadMasterAppointmentTypes(): Promise<void> {
      const res = await firstValueFrom(service.listMasterAppointmentTypes());
      patchState(store, { masterAppointmentTypes: res.data });
    }

    async function reloadMasterDocumentTypes(): Promise<void> {
      const res = await firstValueFrom(service.listMasterDocumentTypes());
      patchState(store, { masterDocumentTypes: res.data });
    }

    async function reloadMasterPlans(): Promise<void> {
      const res = await firstValueFrom(service.listMasterPlans());
      patchState(store, { masterPlans: res.data });
    }

    async function reloadMasterSubscriptionStatuses(): Promise<void> {
      const res = await firstValueFrom(service.listMasterSubscriptionStatuses());
      patchState(store, { masterSubscriptionStatuses: res.data });
    }

    async function reloadMasterAppointmentStatuses(): Promise<void> {
      const res = await firstValueFrom(service.listMasterAppointmentStatuses());
      patchState(store, { masterAppointmentStatuses: res.data });
    }

    async function runMasterMutation(
      action: () => Promise<unknown>,
      reload: () => Promise<void>,
    ): Promise<string | null> {
      patchState(store, { saving: true, error: null });
      try {
        await action();
        await reload();
        patchState(store, { saving: false });
        return null;
      } catch (err: unknown) {
        const message = extractErrorMessage(err);
        patchState(store, { saving: false, error: message });
        return message;
      }
    }

    return {
      clearError(): void {
        patchState(store, { error: null });
      },

      async loadClinicCatalog(kind: CatalogKind): Promise<void> {
        patchState(store, { loading: true });
        try {
          await refreshClinic(kind);
        } catch {
        } finally {
          patchState(store, { loading: false });
        }
      },

      async loadClinicReadOnly(): Promise<void> {
        patchState(store, { loading: true });
        try {
          const [plans, appointmentStatuses, subscriptionStatuses] = await Promise.all([
            firstValueFrom(service.getClinicPlans()),
            firstValueFrom(service.getClinicAppointmentStatuses()),
            firstValueFrom(service.getClinicSubscriptionStatuses()),
          ]);
          patchState(store, {
            plans: plans.data,
            appointmentStatuses: appointmentStatuses.data,
            subscriptionStatuses: subscriptionStatuses.data,
          });
        } catch {
        } finally {
          patchState(store, { loading: false });
        }
      },

      async loadPlans(): Promise<void> {
        try {
          const res = await firstValueFrom(service.getClinicPlans());
          patchState(store, { plans: res.data });
        } catch {
        }
      },

      async activate(
        kind: CatalogKind,
        id: number,
        durationMinutes?: number,
      ): Promise<string | null> {
        patchState(store, { busyItemId: id, error: null });
        try {
          if (kind === 'specialties') {
            await firstValueFrom(service.activateSpecialty(id));
          } else if (kind === 'appointmentTypes') {
            await firstValueFrom(service.activateAppointmentType(id, durationMinutes));
          } else {
            await firstValueFrom(service.activateDocumentType(id));
          }
          await refreshClinic(kind);
          patchState(store, { busyItemId: null });
          return null;
        } catch (err: unknown) {
          const message = extractErrorMessage(err);
          patchState(store, { busyItemId: null, error: message });
          return message;
        }
      },

      async deactivate(kind: CatalogKind, id: number): Promise<string | null> {
        patchState(store, { busyItemId: id, error: null });
        try {
          if (kind === 'specialties') {
            await firstValueFrom(service.deactivateSpecialty(id));
          } else if (kind === 'appointmentTypes') {
            await firstValueFrom(service.deactivateAppointmentType(id));
          } else {
            await firstValueFrom(service.deactivateDocumentType(id));
          }
          await refreshClinic(kind);
          patchState(store, { busyItemId: null });
          return null;
        } catch (err: unknown) {
          const message = extractErrorMessage(err);
          patchState(store, { busyItemId: null, error: message });
          return message;
        }
      },

      async loadMasterSpecialties(): Promise<void> {
        patchState(store, { loading: true });
        await reloadMasterSpecialties();
        patchState(store, { loading: false });
      },

      async loadMasterAppointmentTypes(): Promise<void> {
        patchState(store, { loading: true });
        await reloadMasterAppointmentTypes();
        patchState(store, { loading: false });
      },

      async loadMasterDocumentTypes(): Promise<void> {
        patchState(store, { loading: true });
        await reloadMasterDocumentTypes();
        patchState(store, { loading: false });
      },

      async loadMasterPlans(): Promise<void> {
        patchState(store, { loading: true });
        await reloadMasterPlans();
        patchState(store, { loading: false });
      },

      async loadMasterSubscriptionStatuses(): Promise<void> {
        patchState(store, { loading: true });
        await reloadMasterSubscriptionStatuses();
        patchState(store, { loading: false });
      },

      async loadMasterAppointmentStatuses(): Promise<void> {
        patchState(store, { loading: true });
        await reloadMasterAppointmentStatuses();
        patchState(store, { loading: false });
      },

      createMasterSpecialty(body: SpecialtyMasterRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.createMasterSpecialty(body)),
          reloadMasterSpecialties,
        );
      },

      updateMasterSpecialty(id: number, body: SpecialtyMasterRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.updateMasterSpecialty(id, body)),
          reloadMasterSpecialties,
        );
      },

      deleteMasterSpecialty(id: number): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.deleteMasterSpecialty(id)),
          reloadMasterSpecialties,
        );
      },

      createMasterAppointmentType(body: AppointmentTypeMasterRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.createMasterAppointmentType(body)),
          reloadMasterAppointmentTypes,
        );
      },

      updateMasterAppointmentType(
        id: number,
        body: AppointmentTypeMasterRequest,
      ): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.updateMasterAppointmentType(id, body)),
          reloadMasterAppointmentTypes,
        );
      },

      deleteMasterAppointmentType(id: number): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.deleteMasterAppointmentType(id)),
          reloadMasterAppointmentTypes,
        );
      },

      createMasterDocumentType(body: DocumentTypeMasterRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.createMasterDocumentType(body)),
          reloadMasterDocumentTypes,
        );
      },

      updateMasterDocumentType(
        id: number,
        body: DocumentTypeMasterRequest,
      ): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.updateMasterDocumentType(id, body)),
          reloadMasterDocumentTypes,
        );
      },

      deleteMasterDocumentType(id: number): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.deleteMasterDocumentType(id)),
          reloadMasterDocumentTypes,
        );
      },

      createMasterPlan(body: PlanMasterRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.createMasterPlan(body)),
          reloadMasterPlans,
        );
      },

      updateMasterPlan(id: number, body: PlanMasterRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.updateMasterPlan(id, body)),
          reloadMasterPlans,
        );
      },

      deleteMasterPlan(id: number): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.deleteMasterPlan(id)),
          reloadMasterPlans,
        );
      },

      createMasterSubscriptionStatus(body: SystemCatalogRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.createMasterSubscriptionStatus(body)),
          reloadMasterSubscriptionStatuses,
        );
      },

      updateMasterSubscriptionStatus(
        id: number,
        body: SystemCatalogRequest,
      ): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.updateMasterSubscriptionStatus(id, body)),
          reloadMasterSubscriptionStatuses,
        );
      },

      deleteMasterSubscriptionStatus(id: number): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.deleteMasterSubscriptionStatus(id)),
          reloadMasterSubscriptionStatuses,
        );
      },

      createMasterAppointmentStatus(body: SystemCatalogRequest): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.createMasterAppointmentStatus(body)),
          reloadMasterAppointmentStatuses,
        );
      },

      updateMasterAppointmentStatus(
        id: number,
        body: SystemCatalogRequest,
      ): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.updateMasterAppointmentStatus(id, body)),
          reloadMasterAppointmentStatuses,
        );
      },

      deleteMasterAppointmentStatus(id: number): Promise<string | null> {
        return runMasterMutation(
          () => firstValueFrom(service.deleteMasterAppointmentStatus(id)),
          reloadMasterAppointmentStatuses,
        );
      },
    };
  }),
);
