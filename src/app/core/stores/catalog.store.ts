import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogService } from '../services/catalog.service';
import { AuthStore } from '../auth/auth.store';
import {
  AppointmentTypeResponse,
  CatalogItemResponse,
  CreateCatalogItemRequest,
  CreatePlanRequest,
  CreateSpecialtyRequest,
  PlanResponse,
  SpecialtyResponse,
} from '../models/catalog.model';

interface CatalogState {
  specialties: SpecialtyResponse[];
  plans: PlanResponse[];
  documentTypes: CatalogItemResponse[];
  subscriptionStatuses: CatalogItemResponse[];
  appointmentStatuses: CatalogItemResponse[];
  appointmentTypes: AppointmentTypeResponse[];
  loadingSpecialties: boolean;
  loadingPlans: boolean;
  loadingDocumentTypes: boolean;
  loadingSubscriptionStatuses: boolean;
  loadingAppointmentStatuses: boolean;
  loadingAppointmentTypes: boolean;
  saving: boolean;
  selectedTenantId: number | null;
}

export const CatalogStore = signalStore(
  { providedIn: 'root' },
  withState<CatalogState>({
    specialties: [],
    plans: [],
    documentTypes: [],
    subscriptionStatuses: [],
    appointmentStatuses: [],
    appointmentTypes: [],
    loadingSpecialties: false,
    loadingPlans: false,
    loadingDocumentTypes: false,
    loadingSubscriptionStatuses: false,
    loadingAppointmentStatuses: false,
    loadingAppointmentTypes: false,
    saving: false,
    selectedTenantId: null,
  }),
  withMethods((store, service = inject(CatalogService), authStore = inject(AuthStore)) => ({
    setSelectedTenantId(id: number | null): void {
      patchState(store, { selectedTenantId: id });
    },

    async loadSpecialties(): Promise<void> {
      if (authStore.isSuperAdmin() && store.selectedTenantId() === null) {
        patchState(store, { specialties: [] });
        return;
      }
      patchState(store, { loadingSpecialties: true });
      try {
        const res = authStore.isSuperAdmin()
          ? await firstValueFrom(service.getSuperAdminSpecialties(store.selectedTenantId()!))
          : await firstValueFrom(service.getSpecialties());
        patchState(store, { specialties: res.data, loadingSpecialties: false });
      } catch {
        patchState(store, { loadingSpecialties: false });
      }
    },

    async createSpecialty(body: CreateSpecialtyRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        if (authStore.isSuperAdmin()) {
          const tenantId = store.selectedTenantId();
          if (tenantId === null) { patchState(store, { saving: false }); return false; }
          await firstValueFrom(service.createSuperAdminSpecialty(body, tenantId));
          const res = await firstValueFrom(service.getSuperAdminSpecialties(tenantId));
          patchState(store, { specialties: res.data, saving: false });
        } else {
          await firstValueFrom(service.createSpecialty(body));
          const res = await firstValueFrom(service.getSpecialties());
          patchState(store, { specialties: res.data, saving: false });
        }
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteSpecialty(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        if (authStore.isSuperAdmin()) {
          await firstValueFrom(service.deleteSuperAdminSpecialty(id));
        } else {
          await firstValueFrom(service.deleteSpecialty(id));
        }
        patchState(store, { specialties: store.specialties().filter((s) => s.id !== id), saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async loadPlans(): Promise<void> {
      patchState(store, { loadingPlans: true });
      try {
        const res = await firstValueFrom(service.getPlans());
        patchState(store, { plans: res.data, loadingPlans: false });
      } catch {
        patchState(store, { loadingPlans: false });
      }
    },

    async createPlan(body: CreatePlanRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.createPlan(body));
        const res = await firstValueFrom(service.getPlans());
        patchState(store, { plans: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async deletePlan(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.deletePlan(id));
        patchState(store, { plans: store.plans().filter((p) => p.id !== id), saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async loadDocumentTypes(): Promise<void> {
      patchState(store, { loadingDocumentTypes: true });
      try {
        const res = await firstValueFrom(service.getDocumentTypes());
        patchState(store, { documentTypes: res.data, loadingDocumentTypes: false });
      } catch {
        patchState(store, { loadingDocumentTypes: false });
      }
    },

    async createDocumentType(body: CreateCatalogItemRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.createDocumentType(body));
        const res = await firstValueFrom(service.getDocumentTypes());
        patchState(store, { documentTypes: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteDocumentType(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.deleteDocumentType(id));
        patchState(store, { documentTypes: store.documentTypes().filter((d) => d.id !== id), saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async loadSubscriptionStatuses(): Promise<void> {
      patchState(store, { loadingSubscriptionStatuses: true });
      try {
        const res = await firstValueFrom(service.getSubscriptionStatuses());
        patchState(store, { subscriptionStatuses: res.data, loadingSubscriptionStatuses: false });
      } catch {
        patchState(store, { loadingSubscriptionStatuses: false });
      }
    },

    async createSubscriptionStatus(body: CreateCatalogItemRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.createSubscriptionStatus(body));
        const res = await firstValueFrom(service.getSubscriptionStatuses());
        patchState(store, { subscriptionStatuses: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteSubscriptionStatus(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.deleteSubscriptionStatus(id));
        patchState(store, { subscriptionStatuses: store.subscriptionStatuses().filter((s) => s.id !== id), saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async loadAppointmentStatuses(): Promise<void> {
      patchState(store, { loadingAppointmentStatuses: true });
      try {
        const res = await firstValueFrom(service.getAppointmentStatuses());
        patchState(store, { appointmentStatuses: res.data, loadingAppointmentStatuses: false });
      } catch {
        patchState(store, { loadingAppointmentStatuses: false });
      }
    },

    async createAppointmentStatus(body: CreateCatalogItemRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.createAppointmentStatus(body));
        const res = await firstValueFrom(service.getAppointmentStatuses());
        patchState(store, { appointmentStatuses: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteAppointmentStatus(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.deleteAppointmentStatus(id));
        patchState(store, { appointmentStatuses: store.appointmentStatuses().filter((s) => s.id !== id), saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async loadAppointmentTypes(): Promise<void> {
      if (authStore.isSuperAdmin() && store.selectedTenantId() === null) {
        patchState(store, { appointmentTypes: [] });
        return;
      }
      patchState(store, { loadingAppointmentTypes: true });
      try {
        const res = authStore.isSuperAdmin()
          ? await firstValueFrom(service.getSuperAdminAppointmentTypes(store.selectedTenantId()!))
          : await firstValueFrom(service.getAppointmentTypes());
        patchState(store, { appointmentTypes: res.data, loadingAppointmentTypes: false });
      } catch {
        patchState(store, { loadingAppointmentTypes: false });
      }
    },

    async createAppointmentType(body: CreateCatalogItemRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        if (authStore.isSuperAdmin()) {
          const tenantId = store.selectedTenantId();
          if (tenantId === null) { patchState(store, { saving: false }); return false; }
          await firstValueFrom(service.createSuperAdminAppointmentType(body, tenantId));
          const res = await firstValueFrom(service.getSuperAdminAppointmentTypes(tenantId));
          patchState(store, { appointmentTypes: res.data, saving: false });
        } else {
          await firstValueFrom(service.createAppointmentType(body));
          const res = await firstValueFrom(service.getAppointmentTypes());
          patchState(store, { appointmentTypes: res.data, saving: false });
        }
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async deleteAppointmentType(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        if (authStore.isSuperAdmin()) {
          await firstValueFrom(service.deleteSuperAdminAppointmentType(id));
        } else {
          await firstValueFrom(service.deleteAppointmentType(id));
        }
        patchState(store, { appointmentTypes: store.appointmentTypes().filter((t) => t.id !== id), saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },
  })),
);
