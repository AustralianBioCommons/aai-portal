import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { biocommonsBundles, Bundle } from '../../core/constants/constants';
import { passwordRequirements } from '../../../utils/validation/passwords';
import { usernameRequirements } from '../../../utils/validation/usernames';
import { ValidationService } from '../../core/services/validation.service';
import { environment } from '../../../environments/environment';
import { RecaptchaModule } from 'ng-recaptcha-2';

interface RegistrationForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

export interface RegistrationRequest {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  bundle: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [ReactiveFormsModule, CommonModule, RecaptchaModule],
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private validationService = inject(ValidationService);
  private http = inject(HttpClient);

  currentStep = 1;
  totalSteps = 5;

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken: string | null = null;
  recaptchaAttempted = false;

  errorMessage: string | null = null;
  isSubmitting = false;

  bundles: Bundle[] = biocommonsBundles;

  bundleForm: FormGroup = this.formBuilder.group({
    selectedBundle: ['', Validators.required],
  });

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group({
      firstName: this.formBuilder.nonNullable.control('', [
        Validators.required,
      ]),
      lastName: this.formBuilder.nonNullable.control('', [Validators.required]),
      email: this.formBuilder.nonNullable.control('', [
        Validators.required,
        Validators.email,
      ]),
      username: this.formBuilder.nonNullable.control('', usernameRequirements),
      password: this.formBuilder.nonNullable.control('', passwordRequirements),
      confirmPassword: this.formBuilder.nonNullable.control('', [
        Validators.required,
      ]),
    });

  termsForm: FormGroup = this.formBuilder.group({});

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );
  }

  private initializeTermsForm() {
    const selectedBundle = this.getSelectedBundle();
    if (selectedBundle) {
      const termsControls: Record<string, FormControl<boolean>> = {};

      selectedBundle.services.forEach((service) => {
        termsControls[service.id] = this.formBuilder.control(false, {
          validators: Validators.requiredTrue,
          nonNullable: true,
        });
      });

      this.termsForm = this.formBuilder.group(termsControls);
    }
  }

  login() {
    this.authService.login();
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken = captchaResponse;
  }

  selectBundle(value: string) {
    const bundle = this.bundles.find((bundle) => bundle.id === value);
    if (!bundle?.disabled) {
      this.bundleForm.patchValue({ selectedBundle: value });
    }
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('selectedBundle')?.value;
    return this.bundles.find((bundle) => bundle.id === selectedId);
  }

  prevStep() {
    if (this.currentStep === 1) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else if (this.currentStep > 1) {
      this.resetStepValidation(this.currentStep);
      this.currentStep--;
    }
  }

  nextStep() {
    switch (this.currentStep) {
      case 1:
        this.handleStepValidation(this.bundleForm);
        break;
      case 2:
        this.handleStepValidation(this.registrationForm, () => {
          this.initializeTermsForm();
        });
        break;
      case 3:
        this.handleStepValidation(this.termsForm);
        break;
      case 4:
        this.completeRegistration();
        break;
      default:
        if (this.currentStep < this.totalSteps) {
          this.currentStep++;
        }
        break;
    }
  }

  private handleStepValidation(form: FormGroup, onSuccess?: () => void) {
    if (this.currentStep === 2) {
      this.recaptchaAttempted = true;
      if (!this.recaptchaToken) {
        form.markAllAsTouched();
        return;
      }
    }

    form.markAllAsTouched();
    if (form.valid) {
      if (onSuccess) {
        onSuccess();
      }
      this.currentStep++;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private resetStepValidation(step: number) {
    this.errorMessage = null;
    switch (step) {
      case 1:
        this.bundleForm.markAsUntouched();
        this.bundleForm.markAsPristine();
        break;
      case 2:
        this.registrationForm.markAsUntouched();
        this.registrationForm.markAsPristine();
        this.validationService.reset();
        this.recaptchaToken = null;
        this.recaptchaAttempted = false;
        break;
      case 3:
        this.termsForm.markAsUntouched();
        this.termsForm.markAsPristine();
        this.recaptchaToken = null;
        this.recaptchaAttempted = false;
        break;
      case 4:
        this.isSubmitting = false;
        break;
    }
  }

  toggleTermsAcceptance(serviceId: string) {
    const currentValue = this.termsForm.get(serviceId)?.value;
    this.termsForm.patchValue({ [serviceId]: !currentValue });
  }

  isFieldInvalid(fieldName: string): boolean {
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

  private completeRegistration() {
    this.isSubmitting = true;
    this.errorMessage = null;

    const registrationData: RegistrationRequest = {
      first_name: this.registrationForm.get('firstName')!.value,
      last_name: this.registrationForm.get('lastName')!.value,
      email: this.registrationForm.get('email')!.value,
      username: this.registrationForm.get('username')!.value,
      password: this.registrationForm.get('password')!.value,
      bundle: this.bundleForm.get('selectedBundle')!.value,
    };

    this.http
      .post(
        `${environment.auth0.backend}/biocommons/register`,
        registrationData,
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Registration failed:', error);
          this.validationService.setBackendErrorMessages(error);
          this.errorMessage =
            error?.error?.message || 'Registration failed. Please try again.';
          this.isSubmitting = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return of(null);
        }),
      )
      .subscribe((result) => {
        this.isSubmitting = false;
        if (result) {
          this.currentStep++;
        }
      });
  }

  getFinalPageButton(): { text: string; action: () => void } {
    const currentUrl = this.router.url;

    if (currentUrl.includes('/bpa/register')) {
      return {
        text: 'Return to Bioplatforms Australia Data Portal',
        action: () =>
          (window.location.href = 'https://aaidemo.bioplatforms.com/'),
      };
    } else if (currentUrl.includes('/galaxy/register')) {
      return {
        text: 'Return to Galaxy Australia',
        action: () =>
          (window.location.href = 'https://galaxy.test.biocommons.org.au/'),
      };
    } else {
      return {
        text: 'Login',
        action: () => this.router.navigate(['/login']),
      };
    }
  }
}
