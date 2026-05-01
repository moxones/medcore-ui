import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MedicalRecordService } from '@core/services/medical-record.service';
import { PatientService } from '@core/services/patient.service';
import { MedicalRecordResponse } from '@core/models/medical-record.model';
import { PatientResponse } from '@core/models/patient.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-medical-records-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './medical-records-page.component.html',
  styleUrl: './medical-records-page.component.scss',
})
export class MedicalRecordsPageComponent {
  private readonly recordService = inject(MedicalRecordService);
  private readonly patientService = inject(PatientService);

  readonly patientIdControl = new FormControl<number | null>(null);
  readonly record = signal<MedicalRecordResponse | null>(null);
  readonly patient = signal<PatientResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async search(): Promise<void> {
    const id = this.patientIdControl.value;
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);
    this.record.set(null);
    this.patient.set(null);

    try {
      const [patientRes, recordRes] = await Promise.all([
        firstValueFrom(this.patientService.getById(id)),
        firstValueFrom(this.recordService.getByPatient(id)),
      ]);
      this.patient.set(patientRes.data);
      this.record.set(recordRes.data);
    } catch {
      this.error.set('No se encontró historial para este paciente.');
    } finally {
      this.loading.set(false);
    }
  }

  clear(): void {
    this.patientIdControl.setValue(null);
    this.record.set(null);
    this.patient.set(null);
    this.error.set(null);
  }
}
