import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SubscriptionService } from '../services/subscription.service';
import { CreateSubscriptionRequest, SubscriptionResponse, UpdateSubscriptionRequest } from '../models/subscription.model';

interface SubscriptionState {
  items: SubscriptionResponse[];
  loading: boolean;
  saving: boolean;
}

export const SubscriptionStore = signalStore(
  { providedIn: 'root' },
  withState<SubscriptionState>({
    items: [],
    loading: false,
    saving: false,
  }),
  withMethods((store, service = inject(SubscriptionService)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true });
      try {
        const res = await firstValueFrom(service.getList());
        patchState(store, { items: res.data, loading: false });
      } catch {
        patchState(store, { loading: false });
      }
    },

    async create(body: CreateSubscriptionRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.create(body));
        const res = await firstValueFrom(service.getList());
        patchState(store, { items: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async update(id: number, body: UpdateSubscriptionRequest): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.update(id, body));
        const res = await firstValueFrom(service.getList());
        patchState(store, { items: res.data, saving: false });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },

    async remove(id: number): Promise<boolean> {
      patchState(store, { saving: true });
      try {
        await firstValueFrom(service.delete(id));
        patchState(store, {
          items: store.items().filter((s) => s.id !== id),
          saving: false,
        });
        return true;
      } catch {
        patchState(store, { saving: false });
        return false;
      }
    },
  })),
);
