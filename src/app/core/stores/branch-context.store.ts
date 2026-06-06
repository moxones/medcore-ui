import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { BranchService } from '@core/services/branch.service';
import { BranchResponse } from '@core/models/branch.model';

const ACTIVE_BRANCH_KEY = 'active_branch_id';

interface BranchContextState {
  branches: BranchResponse[];
  activeBranchId: number | null;
  loading: boolean;
  ready: boolean;
}

export const BranchContextStore = signalStore(
  { providedIn: 'root' },
  withState<BranchContextState>({
    branches: [],
    activeBranchId: null,
    loading: false,
    ready: false,
  }),
  withComputed(({ branches, activeBranchId }) => ({
    activeBranch: computed(() => branches().find((b) => b.id === activeBranchId()) ?? null),
    hasMultiple: computed(() => branches().length > 1),
    activeBranchName: computed(
      () => branches().find((b) => b.id === activeBranchId())?.name ?? '',
    ),
  })),
  withMethods((store, branchSvc = inject(BranchService), platformId = inject(PLATFORM_ID)) => {
    const isBrowser = isPlatformBrowser(platformId);

    function readStoredId(): number | null {
      if (!isBrowser) return null;
      const raw = localStorage.getItem(ACTIVE_BRANCH_KEY);
      const parsed = raw === null ? NaN : Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }

    function persistId(id: number): void {
      if (isBrowser) localStorage.setItem(ACTIVE_BRANCH_KEY, String(id));
    }

    return {
      async init(): Promise<void> {
        if (store.loading()) return;
        patchState(store, { loading: true });
        try {
          const res = await firstValueFrom(branchSvc.getList({ page: 0, size: 100 }));
          const branches = res.data.content;
          const storedId = readStoredId();
          const active = branches.some((b) => b.id === storedId)
            ? storedId
            : (branches[0]?.id ?? null);
          if (active !== null) persistId(active);
          patchState(store, { branches, activeBranchId: active, ready: true, loading: false });
        } catch {
          patchState(store, { branches: [], activeBranchId: null, ready: true, loading: false });
        }
      },

      setActiveBranch(branchId: number): void {
        if (store.activeBranchId() === branchId) return;
        persistId(branchId);
        patchState(store, { activeBranchId: branchId });
      },
    };
  }),
);
