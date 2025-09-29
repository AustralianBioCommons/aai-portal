import { Component, inject, signal } from '@angular/core';
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
import { sbpEmailRequirements } from '../../../shared/validators/emails';
import { ValidationService } from '../../../core/services/validation.service';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

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
  imports: [ReactiveFormsModule, CommonModule, RecaptchaModule, AlertComponent],
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

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', sbpEmailRequirements],
      username: ['', usernameRequirements],
      reason: ['', Validators.required],
      password: ['', passwordRequirements],
      confirmPassword: ['', Validators.required],
    });

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );
  }

  onSubmit(): void {
    this.recaptchaAttempted.set(true);
    if (this.registrationForm.valid && this.recaptchaToken()) {
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
