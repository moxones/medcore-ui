import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { ProcessDisabledStateComponent } from '@shared/components/process-disabled-state/process-disabled-state.component';
import { TriageStore, TriagePatient, TriageStage, TriageTab } from '@core/stores/triage.store';
import { BranchContextStore } from '@core/stores/branch-context.store';
import { ProcessConfigStore } from '@core/stores/process-config.store';
import { CreateTriageRequest, UrgencyLevel } from '@core/models/triage.model';
import {
  computeImc,
  computeUrgency,
  parseBloodPressure,
  priorityToUrgency,
  urgencyLabel,
  urgencyToPriority,
} from '@core/utils/triage-vitals.util';

interface TabDef {
  id: TriageTab;
  label: string;
  icon: string;
}

interface UrgencyOption {
  level: UrgencyLevel;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-triage-queue',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    AlertBannerComponent,
    ProcessDisabledStateComponent,
  ],
  templateUrl: './triage-queue.component.html',
  styleUrl: './triage-queue.component.scss',
})
export class TriageQueueComponent implements OnInit {
  readonly store = inject(TriageStore);
  readonly branchContext = inject(BranchContextStore);
  readonly processConfig = inject(ProcessConfigStore);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');
  readonly urgencyOverride = signal<UrgencyLevel | null>(null);

  readonly vitalsForm = this.fb.nonNullable.group({
    weight: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.5), Validators.max(500)]),
    height: this.fb.control<number | null>(null, [Validators.required, Validators.min(20), Validators.max(260)]),
    temperature: this.fb.control<number | null>(null, [Validators.required, Validators.min(30), Validators.max(45)]),
    heartRate: this.fb.control<number | null>(null, [Validators.required, Validators.min(20), Validators.max(250)]),
    systolic: this.fb.control<number | null>(null, [Validators.required, Validators.min(50), Validators.max(300)]),
    diastolic: this.fb.control<number | null>(null, [Validators.required, Validators.min(30), Validators.max(200)]),
    oxygenSaturation: this.fb.control<number | null>(null, [Validators.required, Validators.min(50), Validators.max(100)]),
    respiratoryRate: this.fb.control<number | null>(null, [Validators.required, Validators.min(5), Validators.max(80)]),
    painScale: this.fb.control<number>(0, [Validators.required, Validators.min(0), Validators.max(10)]),
    notes: this.fb.control<string>(''),
  });

  private readonly formValue = toSignal(this.vitalsForm.valueChanges, {
    initialValue: this.vitalsForm.getRawValue(),
  });

  readonly imc = computed(() => computeImc(this.formValue().weight ?? null, this.formValue().height ?? null));

  readonly suggestedUrgency = computed((): UrgencyLevel => {
    const v = this.formValue();
    return computeUrgency({
      temperature: v.temperature ?? null,
      heartRate: v.heartRate ?? null,
      systolic: v.systolic ?? null,
      diastolic: v.diastolic ?? null,
      oxygenSaturation: v.oxygenSaturation ?? null,
      respiratoryRate: v.respiratoryRate ?? null,
    });
  });

  readonly effectiveUrgency = computed((): UrgencyLevel => this.urgencyOverride() ?? this.suggestedUrgency());

  readonly urgencyOptions: UrgencyOption[] = [
    { level: 'NORMAL', label: 'Sin alertas', icon: 'check_circle' },
    { level: 'URGENT', label: 'Urgente', icon: 'priority_high' },
    { level: 'CRITICAL', label: 'Crítico', icon: 'emergency' },
  ];

  readonly clock = computed(() => this.fmtTime(new Date(this.store.currentTime())));

  readonly todayLabel = computed(() => {
    const d = new Date(this.store.currentTime());
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d);
    return `${weekday} ${day} de ${month}`;
  });

  readonly lastRefreshLabel = computed(() => {
    const diff = Math.max(0, Math.floor((this.store.currentTime() - this.store.lastRefreshAt()) / 1000));
    if (diff < 5) return 'actualizado ahora';
    if (diff < 60) return `hace ${diff}s`;
    return `hace ${Math.floor(diff / 60)} min`;
  });

  readonly tabs: TabDef[] = [
    { id: 'queue', label: 'En triaje', icon: 'monitor_heart' },
    { id: 'scheduled', label: 'Por llegar', icon: 'event_upcoming' },
    { id: 'passed', label: 'Pasados', icon: 'task_alt' },
    { id: 'all', label: 'Todos', icon: 'groups' },
  ];

  constructor() {
    effect(() => {
      const triage = this.store.existingTriage();
      if (!triage) return;
      const parsed = parseBloodPressure(triage.bloodPressure);
      this.urgencyOverride.set(priorityToUrgency(triage.priorityLevel));
      this.vitalsForm.patchValue(
        {
          weight: triage.weight,
          height: triage.height,
          temperature: triage.temperature,
          heartRate: triage.heartRate,
          systolic: triage.systolicPressure ?? parsed.systolic,
          diastolic: triage.diastolicPressure ?? parsed.diastolic,
          oxygenSaturation: triage.oxygenSaturation,
          respiratoryRate: triage.respiratoryRate,
          painScale: triage.painScale ?? 0,
          notes: triage.notes ?? '',
        },
        { emitEvent: true },
      );
    });
  }

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.processConfig.load();
    if (!this.processConfig.triageEnabled()) return;
    void this.store.loadInit();
    interval(15_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.tick();
        void this.store.refresh();
      });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.store.setSearch(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.store.setSearch('');
  }

  selectDoctor(id: number | null): void {
    this.store.setDoctorFilter(id);
  }

  selectTab(tab: TriageTab): void {
    this.store.setTab(tab);
  }

  setUrgency(level: UrgencyLevel): void {
    this.urgencyOverride.set(level);
  }

  private resetForm(): void {
    this.urgencyOverride.set(null);
    this.vitalsForm.reset({
      weight: null,
      height: null,
      temperature: null,
      heartRate: null,
      systolic: null,
      diastolic: null,
      oxygenSaturation: null,
      respiratoryRate: null,
      painScale: 0,
      notes: '',
    });
  }

  openDetail(patient: TriagePatient): void {
    this.resetForm();
    void this.store.select(patient.id);
  }

  closeDetail(): void {
    this.store.clearSelection();
  }

  callNext(): void {
    const next = this.store.nextPending();
    if (next) this.openDetail(next);
  }

  registerArrival(patient: TriagePatient, event?: Event): void {
    event?.stopPropagation();
    void this.store.registerArrival(patient.id);
  }

  passToDoctor(patient: TriagePatient, event?: Event): void {
    event?.stopPropagation();
    void this.store.pass(patient.id);
  }

  async submitTriage(patient: TriagePatient, andPass: boolean): Promise<void> {
    if (this.vitalsForm.invalid) {
      this.vitalsForm.markAllAsTouched();
      return;
    }
    const v = this.vitalsForm.getRawValue();
    const { priorityLevel, prioritySystem } = urgencyToPriority(this.effectiveUrgency());
    const request: CreateTriageRequest = {
      appointmentId: patient.id,
      weight: v.weight,
      height: v.height,
      temperature: v.temperature,
      heartRate: v.heartRate,
      respiratoryRate: v.respiratoryRate,
      oxygenSaturation: v.oxygenSaturation,
      bloodPressure: `${v.systolic}/${v.diastolic}`,
      systolicPressure: v.systolic,
      diastolicPressure: v.diastolic,
      painScale: v.painScale ?? 0,
      priorityLevel,
      prioritySystem,
      notes: v.notes?.trim() ? v.notes.trim() : undefined,
    };
    const ok = await this.store.saveTriage(request, andPass);
    if (ok && andPass) this.closeDetail();
  }

  canTriage(patient: TriagePatient): boolean {
    return patient.stage === 'pending' || patient.stage === 'triaged';
  }

  controlInvalid(name: keyof typeof this.vitalsForm.controls): boolean {
    const control = this.vitalsForm.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  urgencyText(level: UrgencyLevel): string {
    return urgencyLabel(level);
  }

  fmtTime(d: Date): string {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  fmtIso(iso: string): string {
    return this.fmtTime(new Date(iso));
  }

  endTimeLabel(patient: TriagePatient): string {
    const end = new Date(new Date(patient.scheduledAt).getTime() + (patient.durationMinutes ?? 30) * 60_000);
    return this.fmtTime(end);
  }

  stageLabel(stage: TriageStage): string {
    const labels: Record<TriageStage, string> = {
      scheduled: 'Por llegar',
      pending: 'Sin triaje',
      triaged: 'Triaje listo',
      passed: 'Con el médico',
    };
    return labels[stage];
  }

  sourceLabel(patient: TriagePatient): string {
    const labels: Record<string, string> = {
      SELF: 'Auto-agendada',
      PHONE: 'Telefónica',
      IN_PERSON: 'Presencial',
      RECEPTION: 'Recepción',
      WALK_IN: 'Walk-in',
    };
    return patient.bookingSource ? (labels[patient.bookingSource] ?? patient.bookingSource) : 'Recepción';
  }
}
