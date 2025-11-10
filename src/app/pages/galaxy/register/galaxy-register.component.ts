import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { passwordRequirements } from '../../../shared/validators/passwords';
import { usernameRequirements } from '../../../shared/validators/usernames';
import { environment } from '../../../../environments/environment';
import { ValidationService } from '../../../core/services/validation.service';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  emailLengthValidator,
  internationalEmailValidator,
  toAsciiEmail,
} from '../../../shared/validators/emails';

interface GalaxyRegistrationForm {
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  username: FormControl<string>;
}

interface GalaxyRegistrationToken {
  token: string;
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    RecaptchaModule,
    ButtonComponent,
  ],
  templateUrl: './galaxy-register.component.html',
  styleUrl: './galaxy-register.component.css',
})
export class GalaxyRegisterComponent {
  private http = inject(HttpClient);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private validationService = inject(ValidationService);

  route = inject(ActivatedRoute);

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  errorMessage = signal<string | null>(null);
  isFrameLoading = signal(true);

  registerForm: FormGroup<GalaxyRegistrationForm> =
    this.formBuilder.nonNullable.group({
      email: [
        '',
        [
          Validators.required,
          internationalEmailValidator,
          emailLengthValidator,
        ],
      ],
      password: ['', passwordRequirements],
      confirmPassword: ['', [Validators.required, Validators.maxLength(72)]],
      username: ['', usernameRequirements],
    });

  constructor() {
    this.validationService.addFieldErrorMessages('username', {
      required: 'Please enter a public name that will be used to identify you',
      minlength: 'Your public name needs at least 3 characters',
      maxlength: 'Your public name cannot be longer than 128 characters',
      pattern:
        'Your public name must start with a lowercase letter and can only include lowercase letters, numbers, underscores, or dashes',
    });

    this.validationService.setupPasswordConfirmationValidation(
      this.registerForm,
    );
  }

  onSubmit() {
    this.recaptchaAttempted.set(true);
    if (this.registerForm.invalid || !this.recaptchaToken()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formData = this.registerForm.value;
    const normalizedEmail = toAsciiEmail(formData.email!);
    const payload = {
      ...formData,
      email: normalizedEmail,
    };
    this.http
      .get<GalaxyRegistrationToken>(
        `${environment.auth0.backend}/galaxy/register/get-registration-token`,
      )
      .pipe(
        switchMap((response) => {
          const token = response.token;
          if (!token) throw new Error('No token received');

          const headers = new HttpHeaders().set('registration-token', token);
          return this.http.post(
            `${environment.auth0.backend}/galaxy/register`,
            payload,
            {
              headers,
            },
          );
        }),
        catchError((response: HttpErrorResponse) => {
          console.error('Registration failed:', response);
          this.validationService.setBackendErrorMessages(response);
          this.errorMessage.set(
            response?.error?.message || 'Registration failed',
          );
          document.getElementById('register_error_message')?.scrollIntoView();
          return of(null); // return observable to allow subscription to complete
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.errorMessage.set(null);
          this.validationService.reset();
          this.registerForm.reset();
          this.router.navigate(['success'], {
            relativeTo: this.route,
            state: { email: normalizedEmail },
          });
        }
      });
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
  }

  isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(this.registerForm, fieldName);
  }

  getErrorMessages(fieldName: keyof GalaxyRegistrationForm): string[] {
    return this.validationService.getErrorMessages(
      this.registerForm,
      fieldName,
    );
  }

  onFrameLoad(): void {
    this.isFrameLoading.set(false);
  }
}
