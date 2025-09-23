import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { usernameRequirements } from '../../../../utils/validation/usernames';
import { passwordRequirements } from '../../../../utils/validation/passwords';
import { ValidationService } from '../../../core/services/validation.service';
import { RecaptchaModule } from 'ng-recaptcha-2';

export interface RegistrationRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  reason: string;
  password: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RecaptchaModule],
  templateUrl: './sbp-register.component.html',
  styleUrl: './sbp-register.component.css',
})
export class SbpRegisterComponent {
  private readonly errorNotificationTimeout = 5000;
  private readonly backendURL = `${environment.auth0.backend}/sbp/register`;

  private formBuilder = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private validationService = inject(ValidationService);
  private route = inject(ActivatedRoute);

  errorNotification = signal<string | null>(null);

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken: string | null = null;
  recaptchaAttempted = false;

  registrationForm = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [usernameRequirements]],
    reason: ['', [Validators.required]],
    password: ['', passwordRequirements],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );
  }

  onSubmit(): void {
    this.recaptchaAttempted = true;
    if (this.registrationForm.valid && this.recaptchaToken) {
      const formValue = this.registrationForm.value;
      const requestBody: RegistrationRequest = {
        first_name: formValue.firstName!,
        last_name: formValue.lastName!,
        email: formValue.email!,
        username: formValue.username!,
        reason: formValue.reason!,
        password: formValue.password!,
      };

      this.http.post(this.backendURL, requestBody).subscribe({
        next: () =>
          this.router.navigate(['success'], { relativeTo: this.route }),
        error: (error: HttpErrorResponse) => {
          this.showErrorNotification(error?.error?.message);
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
    this.recaptchaToken = captchaResponse;
  }

  resetForm(): void {
    this.registrationForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      reason: '',
      password: '',
      confirmPassword: '',
    });
    this.registrationForm.markAsPristine();
    this.registrationForm.markAsUntouched();
    this.validationService.reset();
    this.recaptchaToken = null;
    this.recaptchaAttempted = false;
  }

  showErrorNotification(message: string): void {
    this.errorNotification.set(message);
    setTimeout(
      () => this.errorNotification.set(null),
      this.errorNotificationTimeout,
    );
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(
      this.registrationForm,
      fieldName,
    );
  }

  getErrorMessages(
    fieldName:
      | keyof RegistrationRequest
      | 'confirmPassword'
      | 'firstName'
      | 'lastName',
  ): string[] {
    return this.validationService.getErrorMessages(
      this.registrationForm,
      fieldName,
    );
  }
}
