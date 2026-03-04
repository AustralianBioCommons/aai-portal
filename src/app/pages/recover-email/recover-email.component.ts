import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { ApiService } from '../../core/services/api.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { environment } from '../../../environments/environment';
import { ValidationService } from '../../core/services/validation.service';

@Component({
  selector: 'app-recover-email',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RecaptchaModule,
    ButtonComponent,
    RouterLink,
  ],
  templateUrl: './recover-email.component.html',
  styleUrl: './recover-email.component.css',
})
export class RecoverEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly validationService = inject(ValidationService);
  readonly supportEmail = 'support@biocommons.org.au';

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
  });
  readonly recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  readonly recaptchaToken = signal<string | null>(null);
  readonly recaptchaAttempted = signal(false);

  readonly isSubmitting = signal(false);
  readonly maskedEmail = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly usernameNotFound = signal(false);

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
  }

  onSubmit(): void {
    this.recaptchaAttempted.set(true);
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.recaptchaToken()) {
      return;
    }

    const username = this.form.getRawValue().username.trim();
    const recaptchaToken = this.recaptchaToken()!;
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.maskedEmail.set(null);
    this.usernameNotFound.set(false);

    this.apiService
      .recoverLoginEmailByUsername(username, recaptchaToken)
      .subscribe({
        next: (response) => {
          if (!response.found || !response.masked_email) {
            const isUsernameNotFound =
              response.message === 'No account found for that username.';
            this.usernameNotFound.set(isUsernameNotFound);
            this.errorMessage.set(response.message || 'Request failed.');
          } else {
            this.maskedEmail.set(response.masked_email);
          }
          this.isSubmitting.set(false);
        },
        error: () => {
          this.errorMessage.set('Something went wrong. Please try again.');
          this.isSubmitting.set(false);
        },
      });
  }

  protected isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    return this.validationService.isFieldInvalid(form, fieldName);
  }

  protected getErrorMessages(form: FormGroup, fieldName: string): string[] {
    return this.validationService.getErrorMessages(form, fieldName);
  }
}
