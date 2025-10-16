import { Component, inject, signal } from '@angular/core';
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
import { biocommonsBundles, Bundle } from '../../core/constants/constants';
import { passwordRequirements } from '../../shared/validators/passwords';
import { usernameRequirements } from '../../shared/validators/usernames';
import { ValidationService } from '../../core/services/validation.service';
import { environment } from '../../../environments/environment';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

export interface RegistrationForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

interface RegistrationRequest {
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
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RecaptchaModule,
    AlertComponent,
    ButtonComponent,
  ],
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private validationService = inject(ValidationService);
  private http = inject(HttpClient);

  currentStep = signal(1);
  totalSteps = 5;

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  errorAlert = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  bundles: Bundle[] = biocommonsBundles;

  bundleForm: FormGroup = this.formBuilder.nonNullable.group({
    selectedBundle: ['', Validators.required],
  });

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', usernameRequirements],
      password: ['', passwordRequirements],
      confirmPassword: ['', Validators.required],
    });

  termsForm: FormGroup = this.formBuilder.nonNullable.group({});

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );
  }

  private initializeTermsForm() {
    const selectedBundle = this.getSelectedBundle();
    if (!selectedBundle) return;

    const termsControls = Object.fromEntries(
      selectedBundle.services.map((service) => [
        service.id,
        this.formBuilder.nonNullable.control(false, Validators.requiredTrue),
      ]),
    );

    this.termsForm = this.formBuilder.nonNullable.group(termsControls);
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
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
    if (this.currentStep() === 1) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else if (this.currentStep() > 1) {
      this.resetStepValidation(this.currentStep());
      this.currentStep.update((step) => step - 1);
    }
  }

  nextStep() {
    switch (this.currentStep()) {
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
        if (this.currentStep() < this.totalSteps) {
          this.currentStep.update((step) => step + 1);
        }
        break;
    }
  }

  private handleStepValidation(form: FormGroup, onSuccess?: () => void) {
    if (this.currentStep() === 2) {
      this.recaptchaAttempted.set(true);
      if (!this.recaptchaToken()) {
        form.markAllAsTouched();
        return;
      }
    }

    form.markAllAsTouched();
    if (form.valid) {
      if (onSuccess) {
        onSuccess();
      }
      this.currentStep.update((step) => step + 1);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private resetStepValidation(step: number) {
    this.errorAlert.set(null);
    switch (step) {
      case 1:
        this.bundleForm.markAsUntouched();
        this.bundleForm.markAsPristine();
        break;
      case 2:
        this.registrationForm.markAsUntouched();
        this.registrationForm.markAsPristine();
        this.validationService.reset();
        this.recaptchaToken.set(null);
        this.recaptchaAttempted.set(false);
        break;
      case 3:
        this.termsForm.markAsUntouched();
        this.termsForm.markAsPristine();
        this.recaptchaToken.set(null);
        this.recaptchaAttempted.set(false);
        break;
      case 4:
        this.isSubmitting.set(false);
        break;
    }
  }

  toggleTermsAcceptance(serviceId: string) {
    const currentValue = this.termsForm.get(serviceId)?.value;
    this.termsForm.patchValue({ [serviceId]: !currentValue });
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

  private completeRegistration() {
    this.isSubmitting.set(true);
    this.errorAlert.set(null);

    const formValue = this.registrationForm.value;
    const requestBody: RegistrationRequest = {
      first_name: formValue.firstName!,
      last_name: formValue.lastName!,
      email: formValue.email!,
      username: formValue.username!,
      password: formValue.password!,
      bundle: this.bundleForm.get('selectedBundle')!.value,
    };

    this.http
      .post(`${environment.auth0.backend}/biocommons/register`, requestBody)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Registration failed:', error);
          this.validationService.setBackendErrorMessages(error);
          this.errorAlert.set(
            error?.error?.message || 'Registration failed. Please try again.',
          );
          this.isSubmitting.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return of(null);
        }),
      )
      .subscribe((result) => {
        this.isSubmitting.set(false);
        if (result) {
          this.currentStep.update((step) => step + 1);
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
