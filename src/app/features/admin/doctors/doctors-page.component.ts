import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { DoctorStore } from '@core/stores/doctor.store';
import { AuthStore } from '@core/auth/auth.store';
import { DoctorCardResponse, BranchDaySchedule } from '@core/models/doctor.model';
import { RegisterDoctorDialogComponent } from '@shared/dialogs/register-doctor/register-doctor-dialog.component';
import { DoctorSpecialtiesDialogComponent } from '@shared/dialogs/doctor-specialties/doctor-specialties-dialog.component';
import { DoctorEditDialogComponent, DoctorEditDialogData } from '@shared/dialogs/doctor-edit/doctor-edit-dialog.component';
import { DoctorBranchesDialogComponent, DoctorBranchesDialogData } from '@shared/dialogs/doctor-branches/doctor-branches-dialog.component';
import { DoctorScheduleDialogComponent, DoctorScheduleDialogData } from '@shared/dialogs/doctor-schedule/doctor-schedule-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/dialogs/confirm/confirm-dialog.component';

type AvailabilityFilter = 'all' | 'available' | 'unavailable';
type SortOption = 'name' | 'appointments';

function hasActiveSchedule(doctor: DoctorCardResponse): boolean {
  return Object.values(doctor.weekScheduleByBranch).some(branch =>
    Object.values(branch.scheduleByDay).some(v => v !== null)
  );
}

function isProfileComplete(doctor: DoctorCardResponse): boolean {
  return doctor.branches.length > 0 && hasActiveSchedule(doctor);
}

@Component({
  selector: 'app-doctors-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './doctors-page.component.html',
  styleUrl: './doctors-page.component.scss',
})
export class DoctorsPageComponent implements OnInit {
  readonly store = inject(DoctorStore);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  readonly DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  readonly DAY_TOOLTIPS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  readonly searchQuery = signal('');
  readonly availabilityFilter = signal<AvailabilityFilter>('all');
  readonly sortBy = signal<SortOption>('name');

  readonly isAdmin = computed(() => this.authStore.isAdmin());

  readonly doctors = computed(() => {
    const all = (this.store.page()?.content ?? []).filter(d => d.isActive);
    if (this.isAdmin()) return all;
    const user = this.authStore.user();
    if (!user) return [];
    const myName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const mine = all.find(d => d.fullName.toLowerCase() === myName);
    return mine ? [mine] : [];
  });

  readonly filteredDoctors = computed(() => {
    if (!this.isAdmin()) return this.doctors();
    const q = this.searchQuery().toLowerCase().trim();
    const availability = this.availabilityFilter();

    return this.doctors().filter(d => {
      if (availability === 'available' && !d.availableToday) return false;
      if (availability === 'unavailable' && d.availableToday) return false;
      if (!q) return true;
      const name = d.fullName.toLowerCase();
      const specs = d.specialties.join(' ').toLowerCase();
      return name.includes(q) || specs.includes(q) || d.licenseNumber.toLowerCase().includes(q);
    });
  });

  readonly sortedDoctors = computed(() => {
    const docs = [...this.filteredDoctors()];
    if (this.sortBy() === 'appointments') {
      docs.sort((a, b) => b.appointmentsThisMonth - a.appointmentsThisMonth);
    } else {
      docs.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    return docs;
  });

  ngOnInit(): void {
    void this.store.load();
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getAvailableCount(): number {
    return this.doctors().filter(d => d.availableToday).length;
  }

  getSpecialtiesCount(): number {
    const specs = new Set(this.doctors().flatMap(d => d.specialties));
    return specs.size;
  }

  getTotalAppointments(): number {
    return this.doctors().reduce((sum, d) => sum + d.appointmentsThisMonth, 0);
  }

  hasSchedule(doctor: DoctorCardResponse): boolean {
    return hasActiveSchedule(doctor);
  }

  isComplete(doctor: DoctorCardResponse): boolean {
    return isProfileComplete(doctor);
  }

  getScheduleBranches(doctor: DoctorCardResponse): BranchDaySchedule[] {
    return Object.values(doctor.weekScheduleByBranch);
  }

  getDayIsActive(scheduleByDay: Record<string, string | null>, dayIndex: number): boolean {
    return !!scheduleByDay[dayIndex.toString()];
  }

  getDayTooltip(scheduleByDay: Record<string, string | null>, dayIndex: number): string {
    const dayName = this.DAY_TOOLTIPS[dayIndex];
    const timeRange = scheduleByDay[dayIndex.toString()];
    return timeRange ? `${dayName}: ${timeRange}` : `${dayName}: sin atención`;
  }

  getAppointmentTrendIcon(trend: number): string {
    if (trend > 0) return 'trending_up';
    if (trend < 0) return 'trending_down';
    return 'trending_flat';
  }

  getAppointmentTrendClass(trend: number): string {
    if (trend > 0) return 'trend--up';
    if (trend < 0) return 'trend--down';
    return 'trend--flat';
  }

  openCreate(): void {
    this.dialog.open(RegisterDoctorDialogComponent, {
      panelClass: 'register-doctor-panel',
      disableClose: true,
      maxWidth: '97vw',
    });
  }

  openEditInfo(doctor: DoctorCardResponse): void {
    const data: DoctorEditDialogData = { doctorId: doctor.id, licenseNumber: doctor.licenseNumber, doctorName: doctor.fullName };
    this.dialog.open(DoctorEditDialogComponent, { data, width: '480px', disableClose: false });
  }

  openSpecialties(doctor: DoctorCardResponse): void {
    this.dialog.open(DoctorSpecialtiesDialogComponent, {
      data: { doctorId: doctor.id, doctorName: doctor.fullName },
      width: '560px',
      disableClose: false,
    });
  }

  openBranches(doctor: DoctorCardResponse): void {
    const data: DoctorBranchesDialogData = { doctorId: doctor.id, doctorName: doctor.fullName };
    this.dialog.open(DoctorBranchesDialogComponent, { data, width: '560px', disableClose: false });
  }

  openSchedule(doctor: DoctorCardResponse): void {
    const data: DoctorScheduleDialogData = { doctorId: doctor.id, doctorName: doctor.fullName };
    this.dialog.open(DoctorScheduleDialogComponent, { data, width: '840px', maxWidth: '98vw', disableClose: false });
  }

  confirmDeactivate(doctor: DoctorCardResponse): void {
    const data: ConfirmDialogData = {
      title: 'Desactivar médico',
      message: `¿Desactivar a ${doctor.fullName}? El médico no podrá recibir nuevas citas y dejará de aparecer en el sistema.`,
      confirmLabel: 'Desactivar',
    };
    this.dialog.open(ConfirmDialogComponent, { data, width: '400px' })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) void this.store.deactivate(doctor.id);
      });
  }

  toggleAvailability(e: Event): void {
    this.availabilityFilter.set((e.target as HTMLSelectElement).value as AvailabilityFilter);
  }

  toggleSort(e: Event): void {
    this.sortBy.set((e.target as HTMLSelectElement).value as SortOption);
  }
}
