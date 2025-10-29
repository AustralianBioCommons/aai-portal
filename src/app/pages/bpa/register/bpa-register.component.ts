import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { ValidationService } from '../../../core/services/validation.service';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  emailLengthValidator,
  internationalEmailValidator,
  toAsciiEmail,
} from '../../../shared/validators/emails';

export interface RegistrationForm {
  username: FormControl<string>;
  fullname: FormControl<string>;
  email: FormControl<string>;
  reason: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

interface RegistrationRequest {
  username: string;
  fullname: string;
  email: string;
  reason: string;
  password: string;
}

@Component({
  selector: 'app-bpa-register',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    RecaptchaModule,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: './bpa-register.component.html',
  styleUrl: './bpa-register.component.css',
})
export class BpaRegisterComponent {
  private formBuilder = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private validationService = inject(ValidationService);
  private route = inject(ActivatedRoute);

  private readonly backendURL = `${environment.auth0.backend}/bpa/register`;

  errorAlert = signal<string | null>(null);
  isSubmitting = signal(false);

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group({
      username: ['', usernameRequirements],
      fullname: ['', Validators.required],
      email: [
        '',
        [
          Validators.required,
          internationalEmailValidator,
          emailLengthValidator,
        ],
      ],
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
        username: formValue.username!,
        fullname: formValue.fullname!,
        email: toAsciiEmail(formValue.email!),
        reason: formValue.reason!,
        password: formValue.password!,
      };

      this.http.post(this.backendURL, requestBody).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['success'], { relativeTo: this.route });
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
    const fullNameControl = this.registrationForm.get('fullname');
    if (!fullNameControl) {
      return;
    }

    const enforce = () => {
      const value = (fullNameControl.value ?? '').trim();
      const exceedsLimit = value.length > 255;
      const existingErrors = fullNameControl.errors ?? {};

      if (exceedsLimit) {
        if (!existingErrors['fullNameTooLong']) {
          fullNameControl.setErrors({
            ...existingErrors,
            fullNameTooLong: true,
          });
        }
      } else if (existingErrors['fullNameTooLong']) {
        const remaining = { ...existingErrors };
        delete remaining['fullNameTooLong'];
        fullNameControl.setErrors(
          Object.keys(remaining).length > 0 ? remaining : null,
        );
      }
    };

    fullNameControl.valueChanges.subscribe(() => enforce());
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

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
