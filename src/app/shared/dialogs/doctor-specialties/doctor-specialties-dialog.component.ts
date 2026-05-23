import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DoctorSpecialtyStore } from '@core/stores/doctor-specialty.store';
import { DoctorSpecialty } from '@core/models/catalog.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

export interface DoctorSpecialtiesDialogData {
  doctorId: number;
  doctorName: string;
}

@Component({
  selector: 'app-doctor-specialties-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-specialties-dialog.component.html',
  styleUrl: './doctor-specialties-dialog.component.scss',
})
export class DoctorSpecialtiesDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DoctorSpecialtiesDialogComponent>);
  readonly data = inject<DoctorSpecialtiesDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(DoctorSpecialtyStore);

  readonly query = signal('');

  readonly filteredAvailable = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.store.available();
    return this.store
      .available()
      .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    void this.store.load(this.data.doctorId);
  }

  isBusy(specialty: DoctorSpecialty): boolean {
    return this.store.busyItemId() === specialty.id;
  }

  async assign(specialty: DoctorSpecialty): Promise<void> {
    if (this.isBusy(specialty)) return;
    await this.store.assign(specialty.id);
  }

  async remove(specialty: DoctorSpecialty): Promise<void> {
    if (this.isBusy(specialty)) return;
    await this.store.remove(specialty.id);
  }

  onSearchInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  close(): void {
    this.dialogRef.close();
  }
}
