import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';
import { DoctorOrdersStore, OrderFilter } from '@core/stores/doctor-orders.store';
import { MedicalOrderStatus, MedicalOrderType } from '@core/models/medical-record.model';

interface FilterPill {
  id: OrderFilter;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-doctor-orders',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressBarModule, AlertBannerComponent],
  templateUrl: './doctor-orders.component.html',
  styleUrl: './doctor-orders.component.scss',
})
export class DoctorOrdersComponent implements OnInit {
  readonly store = inject(DoctorOrdersStore);
  private readonly platformId = inject(PLATFORM_ID);

  readonly filters: FilterPill[] = [
    { id: 'ALL', label: 'Todas', icon: 'list' },
    { id: 'REQUESTED', label: 'Solicitadas', icon: 'pending' },
    { id: 'IN_PROGRESS', label: 'En proceso', icon: 'hourglass_top' },
    { id: 'COMPLETED', label: 'Con resultado', icon: 'fact_check' },
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.store.load();
  }

  setFilter(filter: OrderFilter): void {
    this.store.setFilter(filter);
  }

  typeIcon(type: MedicalOrderType): string {
    const icons: Record<MedicalOrderType, string> = {
      LAB: 'science',
      IMAGING: 'radiology',
      PROCEDURE: 'medical_services',
      REFERRAL: 'forward_to_inbox',
      OTHER: 'note_add',
    };
    return icons[type];
  }

  typeLabel(type: MedicalOrderType): string {
    const labels: Record<MedicalOrderType, string> = {
      LAB: 'Laboratorio',
      IMAGING: 'Imagen',
      PROCEDURE: 'Procedimiento',
      REFERRAL: 'Interconsulta',
      OTHER: 'Otro',
    };
    return labels[type];
  }

  statusLabel(status: MedicalOrderStatus): string {
    const labels: Record<MedicalOrderStatus, string> = {
      REQUESTED: 'Solicitada',
      IN_PROGRESS: 'En proceso',
      COMPLETED: 'Con resultado',
      CANCELLED: 'Cancelada',
    };
    return labels[status];
  }

  statusClass(status: MedicalOrderStatus): string {
    return status.toLowerCase().replace('_', '-');
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  }
}
