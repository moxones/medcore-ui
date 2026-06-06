import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { DoctorPrescriptionsStore } from '@core/stores/doctor-prescriptions.store';
import { PrescriptionDocumentResponse } from '@core/models/doctor-workspace.model';

@Component({
  selector: 'app-doctor-prescriptions',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressBarModule, AlertBannerComponent],
  templateUrl: './doctor-prescriptions.component.html',
  styleUrl: './doctor-prescriptions.component.scss',
})
export class DoctorPrescriptionsComponent implements OnInit {
  readonly store = inject(DoctorPrescriptionsStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly searchQuery = signal('');
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => void this.store.setSearch(value));
    void this.store.load();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.search$.next('');
  }

  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  }

  print(doc: PrescriptionDocumentResponse): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const win = window.open('', '_blank', 'width=720,height=900');
    if (!win) return;
    const rows = doc.items
      .map(
        (p) =>
          `<tr><td>${p.medication}</td><td>${p.dosage ?? ''}</td><td>${p.frequency ?? ''}</td><td>${p.duration ?? ''}</td><td>${p.instructions ?? ''}</td></tr>`,
      )
      .join('');
    win.document.write(`
      <html><head><title>Receta · ${doc.patientName}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        th { color: #475569; font-size: 12px; text-transform: uppercase; }
      </style></head>
      <body>
        <h1>Receta médica</h1>
        <div class="meta">${doc.patientName} · ${this.formatDate(doc.issuedAt)}${doc.diagnosisSummary ? ' · ' + doc.diagnosisSummary : ''}</div>
        <table>
          <thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th><th>Indicaciones</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }
}
