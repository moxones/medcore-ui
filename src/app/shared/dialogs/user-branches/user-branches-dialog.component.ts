import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '@core/services/user.service';
import { BranchService } from '@core/services/branch.service';
import { UserBranchResponse } from '@core/models/user.model';
import { BranchResponse } from '@core/models/branch.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface UserBranchesDialogData {
  userId: number;
  userName: string;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se puede conectar al servidor.';
    const msg = (err.error as { message?: string } | null)?.message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

@Component({
  selector: 'app-user-branches-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    AlertBannerComponent,
  ],
  templateUrl: './user-branches-dialog.component.html',
  styleUrl: './user-branches-dialog.component.scss',
})
export class UserBranchesDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserBranchesDialogComponent>);
  readonly data = inject<UserBranchesDialogData>(MAT_DIALOG_DATA);
  private readonly userService = inject(UserService);
  private readonly branchService = inject(BranchService);

  readonly loading = signal(false);
  readonly busyBranchId = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  readonly assignedBranches = signal<UserBranchResponse[]>([]);
  readonly allBranches = signal<BranchResponse[]>([]);

  readonly availableBranches = computed(() => {
    const assignedIds = new Set(this.assignedBranches().map((b) => b.branchId));
    return this.allBranches().filter((b) => !assignedIds.has(b.id));
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        firstValueFrom(this.userService.getBranches(this.data.userId)),
        firstValueFrom(this.branchService.getList({ size: 100 })),
      ]);
      this.assignedBranches.set(assignedRes.data.filter((b) => b.isActive));
      this.allBranches.set(allRes.data.content);
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async assign(branch: BranchResponse): Promise<void> {
    if (this.busyBranchId() !== null) return;
    this.busyBranchId.set(branch.id);
    this.error.set(null);
    try {
      await firstValueFrom(this.userService.assignBranch(this.data.userId, branch.id));
      const res = await firstValueFrom(this.userService.getBranches(this.data.userId));
      this.assignedBranches.set(res.data.filter((b) => b.isActive));
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.busyBranchId.set(null);
    }
  }

  async remove(branch: UserBranchResponse): Promise<void> {
    if (this.busyBranchId() !== null) return;
    this.busyBranchId.set(branch.branchId);
    this.error.set(null);
    try {
      await firstValueFrom(this.userService.removeBranch(this.data.userId, branch.branchId));
      const res = await firstValueFrom(this.userService.getBranches(this.data.userId));
      this.assignedBranches.set(res.data.filter((b) => b.isActive));
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.busyBranchId.set(null);
    }
  }

  isBusy(id: number): boolean {
    return this.busyBranchId() === id;
  }

  clearError(): void {
    this.error.set(null);
  }

  close(): void {
    this.dialogRef.close();
  }
}
