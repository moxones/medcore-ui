import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StaffBranchStore } from '@core/stores/staff-branch.store';
import { RoleResponse, StaffBranchRow } from '@core/models/user.model';
import { KpiCardComponent } from '@shared/widgets/kpi-card/kpi-card.component';
import {
  UserBranchesDialogComponent,
  UserBranchesDialogData,
} from '@shared/dialogs/user-branches/user-branches-dialog.component';

type BranchFilter = 'all' | 'assigned' | 'unassigned';

@Component({
  selector: 'app-staff-branches-page',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    KpiCardComponent,
  ],
  templateUrl: './staff-branches-page.component.html',
  styleUrl: './staff-branches-page.component.scss',
})
export class StaffBranchesPageComponent implements OnInit {
  readonly store = inject(StaffBranchStore);
  private readonly dialog = inject(MatDialog);

  readonly searchQuery = signal('');
  readonly branchFilter = signal<BranchFilter>('all');

  readonly filteredRows = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.branchFilter();
    return this.store.rows().filter((row) => {
      const assigned = row.branches.length > 0;
      const matchesFilter =
        filter === 'all' ||
        (filter === 'assigned' && assigned) ||
        (filter === 'unassigned' && !assigned);
      if (!matchesFilter) return false;
      if (!q) return true;
      const name = this.fullName(row).toLowerCase();
      return name.includes(q) || row.user.email.toLowerCase().includes(q);
    });
  });

  ngOnInit(): void {
    void this.store.load();
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  fullName(row: StaffBranchRow): string {
    return `${row.user.person.firstName} ${row.user.person.lastName}`;
  }

  avatarInitials(row: StaffBranchRow): string {
    const f = row.user.person.firstName?.[0] ?? '';
    const l = row.user.person.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  private primaryRoleCode(roles: RoleResponse[]): string {
    return roles.some((r) => r.code === 'ASSISTANT') ? 'ASSISTANT' : 'RECEPTIONIST';
  }

  avatarClass(row: StaffBranchRow): string {
    const map: Record<string, string> = {
      ASSISTANT: 'avatar--assistant',
      RECEPTIONIST: 'avatar--receptionist',
    };
    return map[this.primaryRoleCode(row.user.roles)] ?? 'avatar--receptionist';
  }

  accentClass(row: StaffBranchRow): string {
    const map: Record<string, string> = {
      ASSISTANT: 'accent--assistant',
      RECEPTIONIST: 'accent--receptionist',
    };
    return map[this.primaryRoleCode(row.user.roles)] ?? 'accent--receptionist';
  }

  roleClass(row: StaffBranchRow): string {
    const map: Record<string, string> = {
      ASSISTANT: 'role--assistant',
      RECEPTIONIST: 'role--receptionist',
    };
    return map[this.primaryRoleCode(row.user.roles)] ?? 'role--receptionist';
  }

  roleLabel(row: StaffBranchRow): string {
    return this.primaryRoleCode(row.user.roles) === 'ASSISTANT' ? 'Asistente' : 'Recepcionista';
  }

  openManage(row: StaffBranchRow): void {
    const ref = this.dialog.open<UserBranchesDialogComponent, UserBranchesDialogData>(
      UserBranchesDialogComponent,
      {
        width: '560px',
        maxWidth: '95vw',
        data: { userId: row.user.id, userName: this.fullName(row) },
      },
    );
    ref.afterClosed().subscribe(() => {
      void this.store.refreshUser(row.user.id);
    });
  }
}
