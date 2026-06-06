import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../services/user.service';
import { StaffBranchRow, UserResponse } from '../models/user.model';

const STAFF_ROLE_CODES = ['ASSISTANT', 'RECEPTIONIST'];

function isStaff(user: UserResponse): boolean {
  return user.roles.some((role) => STAFF_ROLE_CODES.includes(role.code));
}

interface StaffBranchState {
  rows: StaffBranchRow[];
  loading: boolean;
}

export const StaffBranchStore = signalStore(
  { providedIn: 'root' },
  withState<StaffBranchState>({
    rows: [],
    loading: false,
  }),
  withComputed(({ rows }) => ({
    totalStaff: computed(() => rows().length),
    assignedCount: computed(() => rows().filter((row) => row.branches.length > 0).length),
    unassignedCount: computed(() => rows().filter((row) => row.branches.length === 0).length),
  })),
  withMethods((store, userService = inject(UserService)) => {
    async function fetchRow(user: UserResponse): Promise<StaffBranchRow> {
      const res = await firstValueFrom(userService.getBranches(user.id));
      return { user, branches: res.data.filter((branch) => branch.isActive) };
    }

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true });
        try {
          const usersRes = await firstValueFrom(userService.getList());
          const staff = usersRes.data.filter(isStaff);
          const rows = await Promise.all(staff.map(fetchRow));
          patchState(store, { rows, loading: false });
        } catch {
          patchState(store, { rows: [], loading: false });
        }
      },

      async refreshUser(userId: number): Promise<void> {
        const target = store.rows().find((row) => row.user.id === userId);
        if (!target) return;
        try {
          const updated = await fetchRow(target.user);
          patchState(store, {
            rows: store.rows().map((row) => (row.user.id === userId ? updated : row)),
          });
        } catch {
        }
      },
    };
  }),
);
