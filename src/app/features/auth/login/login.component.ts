import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { TenantStore } from '../../../core/tenant/tenant.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  readonly tenantStore = inject(TenantStore);

  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.tenantStore.load();
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.value;
    await this.authStore.login({ email: email!, password: password! });
  }

  get emailError(): string | null {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched) return null;
    if (ctrl.hasError('required')) return 'El correo es obligatorio';
    if (ctrl.hasError('email')) return 'Ingresa un correo válido';
    return null;
  }

  get passwordError(): string | null {
    const ctrl = this.form.get('password');
    if (!ctrl?.touched) return null;
    if (ctrl.hasError('required')) return 'La contraseña es obligatoria';
    if (ctrl.hasError('minlength')) return 'Mínimo 6 caracteres';
    return null;
  }
}
