import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { usernameRequirements } from '../../../shared/validators/usernames';
import { passwordRequirements } from '../../../shared/validators/passwords';
import {
  sbpEmailRequirements,
  toAsciiEmail,
} from '../../../shared/validators/emails';
import { fullNameLengthValidator } from '../../../shared/validators/full-name';
import { ValidationService } from '../../../core/services/validation.service';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

export interface RegistrationForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  username: FormControl<string>;
  reason: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}
interface RegistrationRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  reason: string;
  password: string;
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RecaptchaModule,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: './sbp-register.component.html',
  styleUrl: './sbp-register.component.css',
})
export class SbpRegisterComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly validationService = inject(ValidationService);
  private readonly http = inject(HttpClient);

  private readonly backendURL = `${environment.auth0.backend}/sbp/register`;

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  errorAlert = signal<string | null>(null);
  isSubmitting = signal(false);

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group(
      {
        firstName: ['', [Validators.required, Validators.maxLength(255)]],
        lastName: ['', [Validators.required, Validators.maxLength(255)]],
        email: ['', sbpEmailRequirements],
        username: ['', usernameRequirements],
        reason: ['', [Validators.required, Validators.maxLength(255)]],
        password: ['', passwordRequirements],
        confirmPassword: ['', [Validators.required, Validators.maxLength(72)]],
      },
      { validators: fullNameLengthValidator() },
    );

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );

    this.registrationForm
      .get('username')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.validationService.hasFieldBackendError('username'))
          this.validationService.clearFieldBackendError('username');
      });

    this.registrationForm
      .get('email')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.validationService.hasFieldBackendError('email'))
          this.validationService.clearFieldBackendError('email');
      });
  }

  onSubmit(): void {
    this.recaptchaAttempted.set(true);
    if (this.registrationForm.valid && this.recaptchaToken()) {
      this.isSubmitting.set(true);
      const formValue = this.registrationForm.value;
      const requestBody: RegistrationRequest = {
        first_name: formValue.firstName!,
        last_name: formValue.lastName!,
        email: toAsciiEmail(formValue.email!),
        username: formValue.username!,
        reason: formValue.reason!,
        password: formValue.password!,
      };

      this.http.post(this.backendURL, requestBody).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['success'], {
            relativeTo: this.route,
            state: { email: requestBody.email },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.errorAlert.set(error?.error?.message);
          this.validationService.setBackendErrorMessages(error);
        },
      });
    } else {
      this.registrationForm.markAllAsTouched();
      const firstInvalidField = Object.keys(
        this.registrationForm.controls,
      ).find((key) => this.registrationForm.get(key)?.invalid);
      if (firstInvalidField) {
        const element = document.getElementById(firstInvalidField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
  }

  isFieldInvalid(fieldName: keyof RegistrationForm): boolean {
    return this.validationService.isFieldInvalid(
      this.registrationForm,
      fieldName,
    );
  }

  getErrorMessages(fieldName: keyof RegistrationForm): string[] {
    return this.validationService.getErrorMessages(
      this.registrationForm,
      fieldName,
    );
  }
}
