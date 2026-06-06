import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '@shared/dialogs/confirm/confirm-dialog.component';
import { DoctorTemplatesStore } from '@core/stores/doctor-templates.store';
import {
  NoteTemplateResponse,
  SaveNoteTemplateRequest,
} from '@core/models/doctor-workspace.model';

@Component({
  selector: 'app-doctor-templates',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule,
    AlertBannerComponent,
  ],
  templateUrl: './doctor-templates.component.html',
  styleUrl: './doctor-templates.component.scss',
})
export class DoctorTemplatesComponent implements OnInit {
  readonly store = inject(DoctorTemplatesStore);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  readonly editorOpen = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    chiefComplaint: [''],
    presentIllness: [''],
    physicalExamination: [''],
    assessment: [''],
    plan: [''],
    treatment: [''],
    notes: [''],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset();
    this.editorOpen.set(true);
  }

  openEdit(template: NoteTemplateResponse): void {
    this.editingId.set(template.id);
    this.form.reset({
      name: template.name,
      chiefComplaint: template.chiefComplaint ?? '',
      presentIllness: template.presentIllness ?? '',
      physicalExamination: template.physicalExamination ?? '',
      assessment: template.assessment ?? '',
      plan: template.plan ?? '',
      treatment: template.treatment ?? '',
      notes: template.notes ?? '',
    });
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
    this.editingId.set(null);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: SaveNoteTemplateRequest = {
      name: v.name ?? '',
      chiefComplaint: v.chiefComplaint || null,
      presentIllness: v.presentIllness || null,
      physicalExamination: v.physicalExamination || null,
      assessment: v.assessment || null,
      plan: v.plan || null,
      treatment: v.treatment || null,
      notes: v.notes || null,
    };
    const ok = await this.store.save(body, this.editingId());
    if (ok) this.closeEditor();
  }

  async remove(template: NoteTemplateResponse): Promise<void> {
    const data: ConfirmDialogData = {
      title: 'Eliminar plantilla',
      message: `¿Eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { width: '400px', data });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed) void this.store.remove(template.id);
  }

  preview(template: NoteTemplateResponse): string {
    return (
      template.chiefComplaint ||
      template.assessment ||
      template.plan ||
      template.presentIllness ||
      'Plantilla sin contenido de previsualización'
    );
  }
}
