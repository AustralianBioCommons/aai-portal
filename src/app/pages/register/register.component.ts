import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of, forkJoin } from 'rxjs';
import { biocommonsBundles, Bundle } from '../../core/constants/constants';
import { passwordRequirements } from '../../shared/validators/passwords';
import { usernameRequirements } from '../../shared/validators/usernames';
import { ValidationService } from '../../core/services/validation.service';
import { environment } from '../../../environments/environment';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  internationalEmailValidator,
  toAsciiEmail,
} from '../../shared/validators/emails';
import { emailLengthValidator } from '../../shared/validators/emails';
import { RegistrationNavbarComponent } from '../../shared/components/registration-navbar/registration-navbar.component';
import { AvailabilityResponse } from '../../shared/types/backend.types';

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
  bundle?: string;
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
    RegistrationNavbarComponent,
  ],
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private validationService = inject(ValidationService);
  private http = inject(HttpClient);
  private readonly bpaPlatformUrl =
    environment.platformUrls.bpaPlatform.replace(/\/+$/, '');
  private readonly galaxyPlatformUrl =
    environment.platformUrls.galaxyPlatform.replace(/\/+$/, '');

  currentStep = signal(1);
  totalSteps = 6;

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  errorAlert = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  isCheckingAvailability = signal<boolean>(false);
  registrationEmail = signal<string | null>(null);

  bundles: Bundle[] = biocommonsBundles;

  bundleForm: FormGroup = this.formBuilder.nonNullable.group({
    selectedBundle: [''],
  });

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group({
      firstName: ['', [Validators.required, Validators.maxLength(255)]],
      lastName: ['', [Validators.required, Validators.maxLength(255)]],
      email: [
        '',
        [
          Validators.required,
          internationalEmailValidator,
          emailLengthValidator,
        ],
      ],
      username: ['', usernameRequirements],
      password: ['', passwordRequirements],
      confirmPassword: ['', [Validators.required, Validators.maxLength(72)]],
    });

  termsForm: FormGroup = this.formBuilder.nonNullable.group({});

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );

    this.registrationForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.applyFullNameLengthValidation();
      });

    this.registrationForm
      .get('username')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.validationService.hasFieldBackendError('username')) {
          this.validationService.clearFieldBackendError('username');
        }
      });

    this.registrationForm
      .get('email')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.validationService.hasFieldBackendError('email')) {
          this.validationService.clearFieldBackendError('email');
        }
      });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.updateHistoryState(this.currentStep(), true);
      window.addEventListener('popstate', this.popStateHandler);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.popStateHandler);
    }
  }

  private readonly popStateHandler = (event: PopStateEvent) => {
    const stepFromState = event.state?.step;
    if (typeof stepFromState !== 'number') {
      return;
    }
    this.transitionToStep(stepFromState, { fromHistory: true });
  };

  private applyFullNameLengthValidation(): void {
    const firstNameControl = this.registrationForm.get('firstName');
    const lastNameControl = this.registrationForm.get('lastName');

    if (!firstNameControl || !lastNameControl) {
      return;
    }

    const sanitize = (value: string | null | undefined): string =>
      (value ?? '').trim();

    const firstName = sanitize(firstNameControl.value);
    const lastName = sanitize(lastNameControl.value);
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
        const nextErrors = Object.keys(remaining).length > 0 ? remaining : null;
        control.setErrors(nextErrors);
      }
    };
    updateControlError(firstNameControl, exceedsLimit);
    updateControlError(lastNameControl, exceedsLimit);
  }

  private updateHistoryState(step: number, replace: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }
    const existingState = window.history.state ?? {};
    const newState = { ...existingState, step };
    const title = typeof document !== 'undefined' ? document.title : '';
    if (replace) {
      window.history.replaceState(newState, title);
    } else {
      window.history.pushState(newState, title);
    }
  }

  private transitionToStep(
    targetStep: number,
    options: { fromHistory?: boolean; persistValidation?: boolean } = {},
  ): void {
    const previousStep = this.currentStep();
    if (targetStep === previousStep) {
      return;
    }

    if (targetStep < 1) {
      this.router.navigate(['../'], { relativeTo: this.route });
      return;
    }

    let clampedStep = targetStep;
    if (clampedStep > this.totalSteps) {
      clampedStep = this.totalSteps;
    }

    const movingForward = clampedStep > previousStep;

    if (clampedStep < previousStep) {
      for (let step = previousStep; step > clampedStep; step--) {
        this.resetStepValidation(step, options.persistValidation);
      }
    }

    this.currentStep.set(clampedStep);

    if (!options.fromHistory) {
      this.updateHistoryState(clampedStep, false);
    }

    if (clampedStep === 4 && movingForward) {
      this.initializeTermsForm();
    }

    if (
      !options.fromHistory &&
      typeof window !== 'undefined' &&
      typeof window.scrollTo === 'function'
    ) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private initializeTermsForm() {
    const selectedBundle = this.getSelectedBundle();

    // Always include BioCommons Access terms
    const termsControls: Record<string, FormControl<boolean>> = {
      biocommonsAccess: this.formBuilder.nonNullable.control(
        false,
        Validators.requiredTrue,
      ),
    };

    // Add bundle-specific terms if a bundle is selected
    if (selectedBundle) {
      selectedBundle.services.forEach((service) => {
        termsControls[service.id] = this.formBuilder.nonNullable.control(
          false,
          Validators.requiredTrue,
        );
      });
    }

    this.termsForm = this.formBuilder.nonNullable.group(termsControls);
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
  }

  toggleBundle(value: string) {
    const bundle = this.bundles.find((bundle) => bundle.id === value);
    if (!bundle?.disabled) {
      const currentValue = this.bundleForm.get('selectedBundle')?.value;
      if (currentValue === value) {
        this.bundleForm.patchValue({ selectedBundle: '' });
      } else {
        this.bundleForm.patchValue({ selectedBundle: value });
      }
    }
  }

  onBundleItemClick(event: Event) {
    if (event.target instanceof HTMLAnchorElement) {
      event.stopPropagation();
    }
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('selectedBundle')?.value;
    return this.bundles.find((bundle) => bundle.id === selectedId);
  }

  prevStep() {
    this.errorAlert.set(null);
    if (this.currentStep() === 1) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      const targetStep = this.currentStep() - 1;

      this.transitionToStep(targetStep, { fromHistory: true });
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    }
  }

  nextStep() {
    this.errorAlert.set(null);
    switch (this.currentStep()) {
      case 1:
        this.transitionToStep(this.currentStep() + 1);
        break;
      case 2:
        this.handleStepValidation(this.registrationForm);
        break;
      case 3:
        this.transitionToStep(this.currentStep() + 1);
        break;
      case 4:
        this.handleStepValidation(this.termsForm);
        break;
      case 5:
        this.completeRegistration();
        break;
      default:
        if (this.currentStep() < this.totalSteps) {
          this.transitionToStep(this.currentStep() + 1);
        }
        break;
    }
  }

  private handleStepValidation(
    form: FormGroup,
    onSuccess?: () => void,
  ): boolean {
    if (this.currentStep() === 2) {
      this.recaptchaAttempted.set(true);
      if (!this.recaptchaToken()) {
        form.markAllAsTouched();
        return false;
      }
    }

    form.markAllAsTouched();

    if (form.valid && !this.validationService.hasBackendErrors()) {
      if (this.currentStep() === 2) {
        this.checkAvailability();
        return true;
      }

      if (onSuccess) {
        onSuccess();
      }
      this.transitionToStep(this.currentStep() + 1);
      return true;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
  }

  private resetStepValidation(step: number, persistValidation = false) {
    this.errorAlert.set(null);
    switch (step) {
      case 1:
        break;
      case 2:
        this.registrationForm.markAsUntouched();
        this.registrationForm.markAsPristine();
        if (!persistValidation) {
          this.validationService.resetBackendErrors();
        }
        this.recaptchaToken.set(null);
        this.recaptchaAttempted.set(false);
        break;
      case 3:
        break;
      case 4:
        this.termsForm.markAsUntouched();
        this.termsForm.markAsPristine();
        this.recaptchaToken.set(null);
        this.recaptchaAttempted.set(false);
        break;
      case 5:
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

  private checkAvailability() {
    this.isCheckingAvailability.set(true);
    this.errorAlert.set(null);

    const formValue = this.registrationForm.value;
    const username = formValue.username!;
    const email = toAsciiEmail(formValue.email!);

    forkJoin({
      username: this.http
        .get<AvailabilityResponse>(
          `${environment.auth0.backend}/utils/register/check-username-availability`,
          { params: { username } },
        )
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Username availability check failed:', error);
            return of({ available: true } as AvailabilityResponse);
          }),
        ),
      email: this.http
        .get<AvailabilityResponse>(
          `${environment.auth0.backend}/utils/register/check-email-availability`,
          { params: { email } },
        )
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Email availability check failed:', error);
            return of({ available: true } as AvailabilityResponse);
          }),
        ),
    }).subscribe(({ username: usernameResponse, email: emailResponse }) => {
      this.isCheckingAvailability.set(false);

      const fieldErrors = [
        ...(usernameResponse.field_errors || []),
        ...(emailResponse.field_errors || []),
      ];

      if (fieldErrors.length > 0) {
        fieldErrors.forEach((fieldError) => {
          this.validationService.setBackendErrorMessages({
            error: {
              message: 'Validation failed',
              field_errors: [fieldError],
            },
          } as HttpErrorResponse);
        });

        this.registrationForm.markAllAsTouched();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.transitionToStep(this.currentStep() + 1);
      }
    });
  }

  private completeRegistration() {
    this.isSubmitting.set(true);
    this.errorAlert.set(null);
    this.validationService.resetBackendErrors();

    const formValue = this.registrationForm.value;
    const selectedBundle = this.bundleForm.get('selectedBundle')?.value;

    const requestBody: RegistrationRequest = {
      first_name: formValue.firstName!,
      last_name: formValue.lastName!,
      email: toAsciiEmail(formValue.email!),
      username: formValue.username!,
      password: formValue.password!,
    };

    if (selectedBundle) {
      requestBody.bundle = selectedBundle;
    }

    this.http
      .post(`${environment.auth0.backend}/biocommons/register`, requestBody)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Registration failed:', error);
          this.validationService.setBackendErrorMessages(error);

          const errorMessage =
            error?.error?.message || 'Registration failed. Please try again.';

          if (errorMessage.toLowerCase().includes('already taken')) {
            this.transitionToStep(2, { persistValidation: true });
            this.registrationForm.markAllAsTouched();
          }
          this.errorAlert.set(errorMessage);
          this.isSubmitting.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return of(null);
        }),
      )
      .subscribe((result) => {
        this.isSubmitting.set(false);
        if (result) {
          this.registrationEmail.set(requestBody.email);
          this.transitionToStep(this.currentStep() + 1);
        }
      });
  }

  getFinalPageButton(): { text: string; action: () => void } {
    const serviceParam = this.route.snapshot.queryParamMap.get('service');

    if (serviceParam === 'bpa') {
      return {
        text: 'Return to Bioplatforms Australia Data Portal',
        action: () => (window.location.href = this.bpaPlatformUrl),
      };
    } else if (serviceParam === 'galaxy') {
      return {
        text: 'Return to Galaxy Australia',
        action: () => (window.location.href = this.galaxyPlatformUrl),
      };
    } else {
      return {
        text: 'Login',
        action: () => this.router.navigate(['/login']),
      };
    }
  }
}
