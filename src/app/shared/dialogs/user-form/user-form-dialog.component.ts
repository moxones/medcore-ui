import { Component, inject, Inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserStore } from '@core/stores/user.store';
import { UserResponse } from '@core/models/user.model';
import { TenantResponse } from '@core/models/organization.model';
import { AlertBannerComponent } from '@shared/components/alert-banner/alert-banner.component';

function nonEmptyArray(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  return Array.isArray(v) && v.length > 0 ? null : { required: true };
}

export interface UserFormDialogData {
  user?: UserResponse;
  isSuperAdmin?: boolean;
  organizations?: TenantResponse[];
}

interface RoleOption {
  id: number;
  label: string;
  code: string;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AlertBannerComponent,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  readonly store = inject(UserStore);

  readonly editMode: boolean;
  readonly userId: number | undefined;
  readonly isSuperAdmin: boolean;
  readonly organizations: TenantResponse[];
  readonly error = signal<string | null>(null);

  readonly roleOptions: RoleOption[] = [
    { id: 2, label: 'Admin Clínica',  code: 'CLINIC_ADMIN' },
    { id: 3, label: 'Médico',         code: 'DOCTOR' },
    { id: 4, label: 'Asistente',      code: 'ASSISTANT' },
    { id: 5, label: 'Recepcionista',  code: 'RECEPTIONIST' },
    { id: 6, label: 'Paciente',       code: 'PATIENT' },
  ];

  readonly genderOptions = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
  ];

  readonly documentTypeOptions = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carnet de Extranjería' },
    { value: 'PASS', label: 'Pasaporte' },
  ];

  readonly form = new FormGroup({
    tenantId: new FormControl<number | null>(null),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8)] }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    gender: new FormControl('M', { nonNullable: true, validators: [Validators.required] }),
    documentTypeCode: new FormControl('DNI', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    roleIds: new FormControl<number[]>([], { nonNullable: true, validators: [nonEmptyArray] }),
  });

  constructor(@Inject(MAT_DIALOG_DATA) data: UserFormDialogData) {
    this.editMode = !!data?.user;
    this.isSuperAdmin = data?.isSuperAdmin ?? false;
    this.organizations = data?.organizations ?? [];

    if (data?.user) {
      const snapshot = data.user;
      this.userId = snapshot.id;

      const doc = snapshot.person.documents?.[0];
      this.form.patchValue({
        email: snapshot.email,
        firstName: snapshot.person.firstName,
        lastName: snapshot.person.lastName,
        phone: snapshot.person.phone,
        birthDate: snapshot.person.birthDate,
        gender: snapshot.person.gender,
        documentTypeCode: doc?.documentType.code ?? 'DNI',
        documentNumber: doc?.documentNumber ?? '',
        roleIds: snapshot.roles.map((r) => r.id),
      });
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity();
    } else {
      this.userId = undefined;
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
    }

    if (this.isSuperAdmin && !this.editMode) {
      this.form.controls.tenantId.addValidators(Validators.required);
      this.form.controls.tenantId.updateValueAndValidity();
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);

    const raw = this.form.getRawValue();
    const person = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      birthDate: raw.birthDate,
      gender: raw.gender,
      phone: raw.phone,
      documentTypeCode: raw.documentTypeCode,
      documentNumber: raw.documentNumber,
    };

    const selectedRoles = raw.roleIds
      .map((id) => this.roleOptions.find((o) => o.id === id))
      .filter((o): o is RoleOption => !!o);
    const roleCodes = selectedRoles.map((o) => o.code);

    let err: string | null;

    if (this.editMode && this.userId !== undefined) {
      err = await this.store.update(this.userId, {
        email: raw.email,
        person,
        roles: roleCodes,
      });
    } else if (this.isSuperAdmin && raw.tenantId !== null) {
      err = await this.store.createForTenant({
        email: raw.email,
        password: raw.password,
        person,
        roleIds: raw.roleIds,
        roles: roleCodes,
        tenantId: raw.tenantId,
      });
    } else {
      err = await this.store.create({
        email: raw.email,
        password: raw.password,
        person,
        roleIds: raw.roleIds,
        roles: roleCodes,
      });
    }

    if (!err) {
      this.dialogRef.close(true);
    } else {
      this.error.set(err);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
