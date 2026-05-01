import { Component, OnInit, inject, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserStore } from '@core/stores/user.store';
import { UserResponse } from '@core/models/user.model';
import {
  UserFormDialogComponent,
  UserFormDialogData,
} from '@shared/dialogs/user-form/user-form-dialog.component';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent implements OnInit {
  readonly store = inject(UserStore);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'email', 'roles', 'status', 'actions'];
  readonly rows = computed(() => this.store.users());

  ngOnInit(): void {
    void this.store.load();
  }

  openCreate(): void {
    this.dialog.open<UserFormDialogComponent, UserFormDialogData>(UserFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: {},
    });
  }

  openEdit(user: UserResponse): void {
    this.dialog.open<UserFormDialogComponent, UserFormDialogData>(UserFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { user },
    });
  }

  toggleStatus(user: UserResponse): void {
    void this.store.toggleStatus(user.id, !user.isActive);
  }

  fullName(user: UserResponse): string {
    return `${user.person.firstName} ${user.person.lastName}`;
  }

  roleLabel(roles: string[]): string {
    const map: Record<string, string> = {
      SUPERADMIN: 'Super Admin',
      ADMIN: 'Admin',
      USER: 'Recepcionista',
      PATIENT: 'Paciente',
    };
    return roles.map((r) => map[r] ?? r).join(', ');
  }

  primaryRole(roles: string[]): string {
    const priority = ['SUPERADMIN', 'ADMIN', 'USER', 'PATIENT'];
    return priority.find((r) => roles.includes(r)) ?? roles[0] ?? '';
  }

  roleClass(roles: string[]): string {
    const primary = this.primaryRole(roles);
    const map: Record<string, string> = {
      SUPERADMIN: 'role--superadmin',
      ADMIN: 'role--admin',
      USER: 'role--user',
      PATIENT: 'role--patient',
    };
    return map[primary] ?? '';
  }
}
