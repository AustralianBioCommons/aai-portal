import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import {
  ALLOWED_SPECIAL_CHARACTERS,
  digitRequired,
  lowercaseRequired,
  specialCharacterRequired,
  uppercaseRequired
} from '../../../../utils/passwords';

const backendUrl = 'https://aaibackend.test.biocommons.org.au';

interface GalaxyRegistrationForm {
  email: FormControl<string>;
  password: FormControl<string>;
  password_confirmation: FormControl<string>;
  public_name: FormControl<string>;
}

interface GalaxyRegistrationToken {
  token: string;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './galaxy-register.component.html',
  styleUrl: './galaxy-register.component.css',
})
export class GalaxyRegisterComponent {
  http = inject(HttpClient);
  formBuilder = inject(FormBuilder);
  router = inject(Router);
  titleService = inject(Title);
  registerForm: FormGroup<GalaxyRegistrationForm>;

  errorMessage: string | null = null;
  isFrameLoading = true;

  onFrameLoad(): void {
    this.isFrameLoading = false;
  }

  passwordMatchValidator(
    group: AbstractControl<GalaxyRegistrationForm>,
  ): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  constructor() {
    this.titleService.setTitle('Galaxy Australia - Register');
    this.registerForm = this.formBuilder.group(
      {
        email: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.email],
        }),
        password: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.minLength(8), lowercaseRequired, uppercaseRequired, digitRequired, specialCharacterRequired],
        }),
        password_confirmation: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.minLength(8)],
        }),
        public_name: new FormControl('', {
          nonNullable: true,
          validators: [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern(/^[a-z0-9._-]+$/),
          ],
        }),
      },
      { validators: [this.passwordMatchValidator] },
    );
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formData = this.registerForm.value;

    this.http
      .get<GalaxyRegistrationToken>(
        `${backendUrl}/galaxy/get-registration-token`,
      )
      .pipe(
        switchMap((response) => {
          const token = response.token;
          if (!token) throw new Error('No token received');

          const headers = new HttpHeaders().set('registration-token', token);
          return this.http.post(`${backendUrl}/galaxy/register`, formData, {
            headers,
          });
        }),
        catchError((error) => {
          console.error('Registration failed:', error);
          this.errorMessage = error?.message || 'Registration failed';
          document.getElementById('register_error_message')?.scrollIntoView();
          return of(null); // return observable to allow subscription to complete
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.errorMessage = null;
          this.registerForm.reset();
          this.router.navigate(['/galaxy/register-success']);
        }
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getErrorMessages(fieldName: string): string[] {
    const control = this.registerForm.get(fieldName);
    if (!control?.errors) return [];

    const errorMessages: Record<string, string> = {
      'required': 'This field is required',
      'email': 'Please enter a valid email address',
      'passwordMismatch': 'Passwords do not match',
      'minlength': 'Password must be at least 8 characters',
      'lowercaseRequired': 'Password must contain at least one lowercase letter',
      'uppercaseRequired': 'Password must contain at least one uppercase letter',
      'digitRequired': 'Password must contain at least one digit',
      'specialCharacterRequired': `Password must contain at least one special character (${ALLOWED_SPECIAL_CHARACTERS})`
    };

    // Return all error messages that apply to this control
    return Object.keys(control.errors)
      .filter(key => errorMessages[key])
      .map(key => errorMessages[key]);
  }
}
