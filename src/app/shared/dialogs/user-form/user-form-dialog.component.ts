import { Component, inject, Inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserStore } from '@core/stores/user.store';
import { UserResponse } from '@core/models/user.model';

export interface UserFormDialogData {
  user?: UserResponse;
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
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  readonly store = inject(UserStore);

  readonly editMode: boolean;
  readonly userId: number | undefined;

  readonly roleOptions = [
    { value: 1, label: 'Super Administrador' },
    { value: 2, label: 'Administrador' },
    { value: 3, label: 'Recepcionista (USER)' },
    { value: 4, label: 'Paciente' },
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
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(6)] }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    gender: new FormControl('M', { nonNullable: true, validators: [Validators.required] }),
    documentTypeCode: new FormControl('DNI', { nonNullable: true, validators: [Validators.required] }),
    documentNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    roleIds: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(@Inject(MAT_DIALOG_DATA) data: UserFormDialogData) {
    this.editMode = !!data?.user;
    this.userId = data?.user?.id;

    if (data?.user) {
      const u = data.user;
      this.form.patchValue({
        email: u.email,
        firstName: u.person.firstName,
        lastName: u.person.lastName,
        phone: u.person.phone,
      });
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity();
    } else {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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

    let ok: boolean;

    if (this.editMode && this.userId !== undefined) {
      ok = await this.store.update(this.userId, {
        email: raw.email,
        person,
        roleIds: raw.roleIds,
      });
    } else {
      ok = await this.store.create({
        email: raw.email,
        password: raw.password,
        person,
        roleIds: raw.roleIds,
      });
    }

    if (ok) this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
