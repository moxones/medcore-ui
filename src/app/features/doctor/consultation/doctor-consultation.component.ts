import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import {
  DoctorConsultationStore,
  DraftDiagnosis,
  NoteFields,
} from '@core/stores/doctor-consultation.store';
import { Cie10Code } from '@core/models/cie10.model';
import {
  CertificateType,
  MedicalEntryResponse,
  MedicalOrderType,
} from '@core/models/medical-record.model';
import { NoteTemplateResponse } from '@core/models/doctor-workspace.model';

interface OrderTypeOption {
  value: MedicalOrderType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-doctor-consultation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-consultation.component.html',
  styleUrl: './doctor-consultation.component.scss',
})
export class DoctorConsultationComponent implements OnInit {
  readonly store = inject(DoctorConsultationStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly noteForm = this.fb.group({
    chiefComplaint: [''],
    presentIllness: [''],
    physicalExamination: [''],
    assessment: [''],
    plan: [''],
    treatment: [''],
    notes: [''],
    followUpAt: [''],
  });

  readonly prescriptionForm = this.fb.group({
    medication: ['', Validators.required],
    dosage: [''],
    frequency: [''],
    duration: [''],
    instructions: [''],
  });

  readonly orderForm = this.fb.group({
    orderType: ['LAB' as MedicalOrderType, Validators.required],
    description: ['', Validators.required],
  });

  readonly certificateForm = this.fb.group({
    certificateType: ['DESCANSO' as CertificateType, Validators.required],
    restDays: [1],
    content: ['', Validators.required],
  });

  readonly cie10Term = signal('');
  readonly diagnosisRank = signal<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  readonly activeAside = signal<'triage' | 'history' | 'templates'>('triage');

  readonly orderTypes: OrderTypeOption[] = [
    { value: 'LAB', label: 'Laboratorio', icon: 'science' },
    { value: 'IMAGING', label: 'Imagen', icon: 'radiology' },
    { value: 'PROCEDURE', label: 'Procedimiento', icon: 'medical_services' },
    { value: 'REFERRAL', label: 'Interconsulta', icon: 'forward_to_inbox' },
    { value: 'OTHER', label: 'Otro', icon: 'note_add' },
  ];

  readonly certificateTypes: { value: CertificateType; label: string }[] = [
    { value: 'DESCANSO', label: 'Descanso médico' },
    { value: 'APTITUD', label: 'Aptitud' },
    { value: 'ASISTENCIA', label: 'Asistencia' },
    { value: 'OTRO', label: 'Otro' },
  ];

  readonly patientInitials = computed(() => {
    const name = this.store.appointment()?.patientName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  });

  readonly allergyChips = computed(() => this.splitSummary(this.store.record()?.allergies));
  readonly conditionChips = computed(() =>
    this.splitSummary(this.store.record()?.chronicConditions),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    if (!id) {
      void this.router.navigate(['/doctor/today']);
      return;
    }
    void this.store.load(id);
  }

  goBack(): void {
    void this.router.navigate(['/doctor/today']);
  }

  onCie10Search(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.cie10Term.set(value);
    void this.store.searchCie10(value);
  }

  selectCie10(code: Cie10Code): void {
    this.store.addDiagnosis({
      cie10Id: code.id,
      cie10Code: code.code,
      description: code.description,
      diagnosisRank: this.diagnosisRank(),
    });
    this.cie10Term.set('');
  }

  addFreeDiagnosis(): void {
    const text = this.cie10Term().trim();
    if (text.length < 3) return;
    const diagnosis: DraftDiagnosis = {
      cie10Id: null,
      cie10Code: null,
      description: text,
      diagnosisRank: this.diagnosisRank(),
    };
    this.store.addDiagnosis(diagnosis);
    this.cie10Term.set('');
  }

  addPrescription(): void {
    if (this.prescriptionForm.invalid) {
      this.prescriptionForm.markAllAsTouched();
      return;
    }
    const value = this.prescriptionForm.getRawValue();
    this.store.addPrescription({
      medication: value.medication ?? '',
      dosage: value.dosage || undefined,
      frequency: value.frequency || undefined,
      duration: value.duration || undefined,
      instructions: value.instructions || undefined,
    });
    this.prescriptionForm.reset();
  }

  addOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }
    const value = this.orderForm.getRawValue();
    this.store.addOrder(value.orderType ?? 'LAB', value.description ?? '');
    this.orderForm.reset({ orderType: 'LAB', description: '' });
  }

  addCertificate(): void {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }
    const value = this.certificateForm.getRawValue();
    this.store.addCertificate({
      certificateType: value.certificateType ?? 'DESCANSO',
      content: value.content ?? '',
      restDays: value.certificateType === 'DESCANSO' ? value.restDays : null,
    });
    this.certificateForm.reset({ certificateType: 'DESCANSO', restDays: 1, content: '' });
  }

  applyTemplate(template: NoteTemplateResponse): void {
    this.noteForm.patchValue({
      chiefComplaint: template.chiefComplaint ?? this.noteForm.value.chiefComplaint ?? '',
      presentIllness: template.presentIllness ?? this.noteForm.value.presentIllness ?? '',
      physicalExamination:
        template.physicalExamination ?? this.noteForm.value.physicalExamination ?? '',
      assessment: template.assessment ?? this.noteForm.value.assessment ?? '',
      plan: template.plan ?? this.noteForm.value.plan ?? '',
      treatment: template.treatment ?? this.noteForm.value.treatment ?? '',
      notes: template.notes ?? this.noteForm.value.notes ?? '',
    });
    this.snackBar.open(`Plantilla "${template.name}" aplicada`, 'OK', { duration: 2500 });
  }

  async finalize(): Promise<void> {
    const value = this.noteForm.getRawValue();
    const note: NoteFields = {
      chiefComplaint: value.chiefComplaint ?? '',
      presentIllness: value.presentIllness ?? '',
      physicalExamination: value.physicalExamination ?? '',
      assessment: value.assessment ?? '',
      plan: value.plan ?? '',
      treatment: value.treatment ?? '',
      notes: value.notes ?? '',
      followUpAt: value.followUpAt || null,
    };
    const ok = await this.store.finalize(note);
    if (ok) {
      this.snackBar.open('Consulta finalizada y enviada a cobranza', 'OK', { duration: 3000 });
      void this.router.navigate(['/doctor/today']);
    }
  }

  setAside(tab: 'triage' | 'history' | 'templates'): void {
    this.activeAside.set(tab);
  }

  orderTypeLabel(type: MedicalOrderType): string {
    return this.orderTypes.find((o) => o.value === type)?.label ?? type;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(iso),
    );
  }

  formatTime(iso: string | null): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  entryTitle(entry: MedicalEntryResponse): string {
    if (entry.diagnosis) return entry.diagnosis;
    if (entry.chiefComplaint) return entry.chiefComplaint;
    if (entry.assessment) return entry.assessment;
    return 'Consulta';
  }

  private splitSummary(value: string | null | undefined): string[] {
    if (!value) return [];
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
