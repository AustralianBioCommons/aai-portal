import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
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
  private formBuilder = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private validationService = inject(ValidationService);
  private route = inject(ActivatedRoute);

  private readonly backendURL = `${environment.auth0.backend}/sbp/register`;

  errorAlert = signal<string | null>(null);
  isSubmitting = signal(false);

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group({
      firstName: ['', [Validators.required, Validators.maxLength(255)]],
      lastName: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', sbpEmailRequirements],
      username: ['', usernameRequirements],
      reason: ['', [Validators.required, Validators.maxLength(255)]],
      password: ['', passwordRequirements],
      confirmPassword: ['', [Validators.required, Validators.maxLength(72)]],
    });

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );
    this.applyFullNameLengthValidation();
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

  private applyFullNameLengthValidation(): void {
    const enforce = () => {
      const firstControl = this.registrationForm.get('firstName');
      const lastControl = this.registrationForm.get('lastName');

      if (!firstControl || !lastControl) {
        return;
      }

      const sanitize = (value: string | null | undefined): string =>
        (value ?? '').trim();

      const firstName = sanitize(firstControl.value);
      const lastName = sanitize(lastControl.value);
      const combined = [firstName, lastName].filter(Boolean).join(' ');
      const exceedsLimit = combined.length > 255;

      const updateControlError = (
        control: AbstractControl<string>,
        hasError: boolean,
      ) => {
        const existingErrors = control.errors ?? {};
        if (hasError) {
          if (!existingErrors['fullNameTooLong']) {
            control.setErrors({ ...existingErrors, fullNameTooLong: true });
          }
        } else if (existingErrors['fullNameTooLong']) {
          const remaining = { ...existingErrors };
          delete remaining['fullNameTooLong'];
          const nextErrors = Object.keys(remaining).length ? remaining : null;
          control.setErrors(nextErrors);
        }
      };

      updateControlError(firstControl, exceedsLimit);
      updateControlError(lastControl, exceedsLimit);
    };

    this.registrationForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => enforce());
    enforce();
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
