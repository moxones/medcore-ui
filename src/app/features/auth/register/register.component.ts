import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PatientService } from '@core/services/patient.service';
import { TenantStore } from '@core/tenant/tenant.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly router = inject(Router);
  readonly tenantStore = inject(TenantStore);

  readonly documentTypes = ['DNI', 'CE', 'PASAPORTE'];

  showPassword = signal(false);
  loading = signal(false);
  emailChecking = signal(false);
  emailTaken = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    documentTypeCode: ['DNI', Validators.required],
    documentNumber: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
  });

  ngOnInit(): void {
    this.tenantStore.load();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  async onEmailBlur(): Promise<void> {
    const ctrl = this.form.get('email');
    if (!ctrl || ctrl.invalid || !ctrl.value) return;
    this.emailChecking.set(true);
    this.emailTaken.set(false);
    try {
      const res = await firstValueFrom(this.patientService.checkEmail(ctrl.value));
      this.emailTaken.set(!res.data.available);
    } catch {
      // ignore connectivity errors on check
    } finally {
      this.emailChecking.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.emailTaken() || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password, documentTypeCode, documentNumber } = this.form.value;
    try {
      const res = await firstValueFrom(
        this.patientService.registerPatient({
          email: email!,
          password: password!,
          documentTypeCode: documentTypeCode!,
          documentNumber: documentNumber!,
        }),
      );
      if (res.success) {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      } else {
        this.error.set(res.message ?? 'Error al registrar la cuenta');
      }
    } catch {
      this.error.set('Error de conexión. Intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }

  get emailError(): string | null {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched) return null;
    if (ctrl.hasError('required')) return 'El correo es obligatorio';
    if (ctrl.hasError('email')) return 'Ingresa un correo válido';
    if (this.emailTaken()) return 'Este correo ya está registrado';
    return null;
  }

  get passwordError(): string | null {
    const ctrl = this.form.get('password');
    if (!ctrl?.touched) return null;
    if (ctrl.hasError('required')) return 'La contraseña es obligatoria';
    if (ctrl.hasError('minlength')) return 'Mínimo 8 caracteres';
    return null;
  }

  get documentNumberError(): string | null {
    const ctrl = this.form.get('documentNumber');
    if (!ctrl?.touched) return null;
    if (ctrl.hasError('required')) return 'El número de documento es obligatorio';
    if (ctrl.hasError('minlength')) return 'Mínimo 6 caracteres';
    return null;
  }
}
