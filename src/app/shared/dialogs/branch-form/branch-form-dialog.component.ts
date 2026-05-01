import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BranchStore } from '@core/stores/branch.store';

@Component({
  selector: 'app-branch-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './branch-form-dialog.component.html',
  styleUrl: './branch-form-dialog.component.scss',
})
export class BranchFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<BranchFormDialogComponent>);
  readonly store = inject(BranchStore);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    appointmentDurationMinutes: new FormControl<number>(30, { nonNullable: true, validators: [Validators.required, Validators.min(5), Validators.max(120)] }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const ok = await this.store.create(this.form.getRawValue());
    if (ok) this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
