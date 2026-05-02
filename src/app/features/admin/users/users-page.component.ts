import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserStore } from '@core/stores/user.store';
import { OrganizationStore } from '@core/stores/organization.store';
import { AuthStore } from '@core/auth/auth.store';
import { UserResponse, RoleResponse } from '@core/models/user.model';
import {
  UserFormDialogComponent,
  UserFormDialogData,
} from '@shared/dialogs/user-form/user-form-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/dialogs/confirm/confirm-dialog.component';
import {
  AdminSetPasswordDialogComponent,
  AdminSetPasswordDialogData,
} from '@shared/dialogs/admin-set-password/admin-set-password-dialog.component';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

interface TenantGroup {
  tenantId: number | null;
  tenantName: string | null;
  users: UserResponse[];
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDialogModule,
    AlertBannerComponent,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent implements OnInit {
  readonly store = inject(UserStore);
  readonly authStore = inject(AuthStore);
  readonly orgStore = inject(OrganizationStore);
  private readonly dialog = inject(MatDialog);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly pageError = signal<string | null>(null);

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    return this.store.users().filter((u) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && u.isActive) ||
        (status === 'inactive' && !u.isActive);
      if (!matchesStatus) return false;
      if (!q) return true;
      const name = `${u.person.firstName} ${u.person.lastName}`.toLowerCase();
      const doc = u.person.documents?.[0]?.documentNumber?.toLowerCase() ?? '';
      return name.includes(q) || u.email.toLowerCase().includes(q) || doc.includes(q);
    });
  });

  readonly groupedUsers = computed((): TenantGroup[] => {
    const users = this.filteredUsers();
    if (!this.authStore.isSuperAdmin()) {
      return [{ tenantId: null, tenantName: null, users }];
    }
    const orgs = this.orgStore.items();
    const map = new Map<number, UserResponse[]>();
    for (const u of users) {
      const list = map.get(u.tenantId) ?? [];
      list.push(u);
      map.set(u.tenantId, list);
    }
    return Array.from(map.entries()).map(([tenantId, group]) => ({
      tenantId,
      tenantName: orgs.find((o) => o.id === tenantId)?.name ?? `Tenant #${tenantId}`,
      users: group,
    }));
  });

  ngOnInit(): void {
    void this.store.load();
    if (this.authStore.isSuperAdmin()) {
      void this.orgStore.load();
    }
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  isSuperAdminUser(user: UserResponse): boolean {
    return user.roles.some((r) => r.code === 'SUPER_ADMIN');
  }

  primaryRoleCode(roles: RoleResponse[]): string {
    const priority = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'PATIENT'];
    const found = priority.find((p) => roles.some((r) => r.code === p));
    return found ?? roles[0]?.code ?? '';
  }

  avatarInitials(user: UserResponse): string {
    const f = user.person.firstName?.[0] ?? '';
    const l = user.person.lastName?.[0] ?? '';
    return (f + l).toUpperCase();
  }

  avatarClass(user: UserResponse): string {
    if (!user.isActive) return 'avatar--inactive';
    const primary = this.primaryRoleCode(user.roles);
    const map: Record<string, string> = {
      SUPER_ADMIN:  'avatar--superadmin',
      CLINIC_ADMIN: 'avatar--clinic-admin',
      DOCTOR:       'avatar--doctor',
      ASSISTANT:    'avatar--assistant',
      RECEPTIONIST: 'avatar--receptionist',
      PATIENT:      'avatar--patient',
    };
    return map[primary] ?? 'avatar--default';
  }

  cardAccentClass(user: UserResponse): string {
    if (!user.isActive) return 'accent--inactive';
    const primary = this.primaryRoleCode(user.roles);
    const map: Record<string, string> = {
      SUPER_ADMIN:  'accent--superadmin',
      CLINIC_ADMIN: 'accent--clinic-admin',
      DOCTOR:       'accent--doctor',
      ASSISTANT:    'accent--assistant',
      RECEPTIONIST: 'accent--receptionist',
      PATIENT:      'accent--patient',
    };
    return map[primary] ?? 'accent--default';
  }

  primaryDoc(user: UserResponse): string {
    const doc = user.person.documents?.[0];
    if (!doc) return '';
    return `${doc.documentType?.code ?? 'DOC'}: ${doc.documentNumber}`;
  }

  openCreate(): void {
    this.dialog.open<UserFormDialogComponent, UserFormDialogData>(UserFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        isSuperAdmin: this.authStore.isSuperAdmin(),
        organizations: this.orgStore.items(),
      },
    });
  }

  openEdit(user: UserResponse): void {
    const snapshot = structuredClone(user);
    this.dialog.open<UserFormDialogComponent, UserFormDialogData>(UserFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {
        user: snapshot,
        isSuperAdmin: this.authStore.isSuperAdmin(),
        organizations: this.orgStore.items(),
      },
    });
  }

  openDelete(user: UserResponse): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '400px',
        data: {
          title: 'Eliminar usuario',
          message: `¿Deseas eliminar a ${user.person.firstName} ${user.person.lastName}? Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
        },
      },
    );
    ref.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;
      this.pageError.set(null);
      const err = await this.store.delete(user.id);
      if (err) this.pageError.set(err);
    });
  }

  openSetPassword(user: UserResponse): void {
    this.dialog.open<AdminSetPasswordDialogComponent, AdminSetPasswordDialogData>(
      AdminSetPasswordDialogComponent,
      {
        width: '420px',
        maxWidth: '95vw',
        data: {
          userId: user.id,
          userName: `${user.person.firstName} ${user.person.lastName}`,
        },
      },
    );
  }

  toggleStatus(user: UserResponse): void {
    void this.store.toggleStatus(user.id, !user.isActive);
  }

  fullName(user: UserResponse): string {
    return `${user.person.firstName} ${user.person.lastName}`;
  }

  roleLabel(roles: RoleResponse[]): string {
    const map: Record<string, string> = {
      SUPER_ADMIN:  'Super Admin',
      CLINIC_ADMIN: 'Admin Clínica',
      DOCTOR:       'Médico',
      ASSISTANT:    'Asistente',
      RECEPTIONIST: 'Recepcionista',
      PATIENT:      'Paciente',
    };
    return roles.map((r) => map[r.code] ?? r.name).join(', ');
  }

  roleClass(roles: RoleResponse[]): string {
    const primary = this.primaryRoleCode(roles);
    const map: Record<string, string> = {
      SUPER_ADMIN:  'role--superadmin',
      CLINIC_ADMIN: 'role--clinic-admin',
      DOCTOR:       'role--doctor',
      ASSISTANT:    'role--assistant',
      RECEPTIONIST: 'role--receptionist',
      PATIENT:      'role--patient',
    };
    return map[primary] ?? '';
  }
}
