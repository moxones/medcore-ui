import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DoctorService } from '@core/services/doctor.service';
import { BranchService } from '@core/services/branch.service';
import { DoctorStore } from '@core/stores/doctor.store';
import { DoctorBranchResponse } from '@core/models/doctor.model';
import { BranchResponse } from '@core/models/branch.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface DoctorBranchesDialogData {
  doctorId: number;
  doctorName: string;
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
  selector: 'app-doctor-branches-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-branches-dialog.component.html',
  styleUrl: './doctor-branches-dialog.component.scss',
})
export class DoctorBranchesDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DoctorBranchesDialogComponent>);
  readonly data = inject<DoctorBranchesDialogData>(MAT_DIALOG_DATA);
  private readonly doctorService = inject(DoctorService);
  private readonly branchService = inject(BranchService);
  private readonly doctorStore = inject(DoctorStore);

  readonly loading = signal(false);
  readonly busyBranchId = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  readonly assignedBranches = signal<DoctorBranchResponse[]>([]);
  readonly allBranches = signal<BranchResponse[]>([]);

  readonly availableBranches = computed(() => {
    const assignedIds = new Set(this.assignedBranches().map(b => b.branchId));
    return this.allBranches().filter(b => !assignedIds.has(b.id));
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        firstValueFrom(this.doctorService.getBranches(this.data.doctorId)),
        firstValueFrom(this.branchService.getList({ size: 100 })),
      ]);
      this.assignedBranches.set(assignedRes.data.filter(b => b.isActive));
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
      await firstValueFrom(this.doctorService.assignBranch(this.data.doctorId, branch.id));
      const res = await firstValueFrom(this.doctorService.getBranches(this.data.doctorId));
      this.assignedBranches.set(res.data.filter(b => b.isActive));
      void this.doctorStore.load();
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.busyBranchId.set(null);
    }
  }

  async remove(branch: DoctorBranchResponse): Promise<void> {
    if (this.busyBranchId() !== null) return;
    this.busyBranchId.set(branch.branchId);
    this.error.set(null);
    try {
      await firstValueFrom(this.doctorService.removeBranch(this.data.doctorId, branch.branchId));
      const res = await firstValueFrom(this.doctorService.getBranches(this.data.doctorId));
      this.assignedBranches.set(res.data.filter(b => b.isActive));
      void this.doctorStore.load();
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
