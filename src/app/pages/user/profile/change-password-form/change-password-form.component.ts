import {
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { passwordRequirements } from '../../../../shared/validators/passwords';
import { ValidationService } from '../../../../core/services/validation.service';
import { ApiService } from '../../../../core/services/api.service';

export interface PasswordChangeFormModel {
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}

export type PasswordChangeResult =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, AlertComponent],
  templateUrl: './change-password-form.component.html',
  styleUrl: './change-password-form.component.css',
})
export class ChangePasswordFormComponent {
  private formBuilder = inject(FormBuilder);
  private apiService = inject(ApiService);
  private validationService = inject(ValidationService);
  private destroyRef = inject(DestroyRef);

  completed = output<PasswordChangeResult>();
  cancelled = output<void>();

  submitting = signal(false);
  formSubmitted = signal(false);
  inlineAlert = signal<PasswordChangeResult | null>(null);

  form: FormGroup<PasswordChangeFormModel> =
    this.formBuilder.nonNullable.group({
      currentPassword: ['', [Validators.required, Validators.maxLength(128)]],
      newPassword: ['', passwordRequirements],
      confirmPassword: ['', [Validators.required, Validators.maxLength(72)]],
    });

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.form,
      'newPassword',
      'confirmPassword',
    );
  }

  submit(): void {
    this.formSubmitted.set(true);
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.submitting.set(true);
    this.inlineAlert.set(null);

    this.apiService
      .changePassword({
        current_password: currentPassword!,
        new_password: newPassword!,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.formSubmitted.set(false);
          this.form.reset();
          const message =
            'Password updated successfully. Please use the new password the next time you sign in.';
          this.inlineAlert.set({ type: 'success', message });
          this.completed.emit({ type: 'success', message });
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          const detail =
            error.error?.detail || 'Failed to update password. Please try again.';
          this.inlineAlert.set({ type: 'error', message: detail });
          this.completed.emit({ type: 'error', message: detail });
        },
      });
  }

  cancel(): void {
    if (this.submitting()) {
      return;
    }
    this.form.reset();
    this.formSubmitted.set(false);
    this.inlineAlert.set(null);
    this.cancelled.emit();
  }

  getErrorMessages(field: keyof PasswordChangeFormModel): string[] {
    return this.validationService.getErrorMessages(this.form, field as string);
  }
}
