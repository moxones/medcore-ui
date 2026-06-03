import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NewAppointmentPageComponent } from '@features/reception/new-appointment/new-appointment-page.component';

@Component({
  selector: 'app-patient-new-appointment',
  standalone: true,
  imports: [NewAppointmentPageComponent],
  template: `<app-new-appointment-page [selfBooking]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientNewAppointmentComponent {}
