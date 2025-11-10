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
import { catchError, of } from 'rxjs';
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
import { BiocommonsNavbarComponent } from '../../shared/components/biocommons-navbar/biocommons-navbar.component';

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
    BiocommonsNavbarComponent,
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
  protected readonly registrationEmail = signal<string | null>(null);

  private readonly popStateHandler = (event: PopStateEvent) => {
    const stepFromState = event.state?.step;
    if (typeof stepFromState !== 'number') {
      return;
    }
    this.transitionToStep(stepFromState, { fromHistory: true });
  };

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );
    this.applyFullNameLengthValidation();
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
          const nextErrors =
            Object.keys(remaining).length > 0 ? remaining : null;
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

  selectBundle(value: string) {
    const bundle = this.bundles.find((bundle) => bundle.id === value);
    if (!bundle?.disabled) {
      this.bundleForm.patchValue({ selectedBundle: value });
      this.bundleForm.get('selectedBundle')?.markAsDirty();
      this.bundleForm.get('selectedBundle')?.markAsTouched();
      this.bundleForm.updateValueAndValidity();

      if (this.currentStep() === 1) {
        this.advanceFromBundleSelection();
      }
    }
  }

  private advanceFromBundleSelection(): void {
    this.handleStepValidation(this.bundleForm);
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
    options: { fromHistory?: boolean } = {},
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
        this.resetStepValidation(step);
      }
    }

    this.currentStep.set(clampedStep);

    if (!options.fromHistory) {
      this.updateHistoryState(clampedStep, false);
    }

    if (clampedStep === 3 && movingForward && this.getSelectedBundle()) {
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

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('selectedBundle')?.value;
    return this.bundles.find((bundle) => bundle.id === selectedId);
  }

  prevStep() {
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
    switch (this.currentStep()) {
      case 1:
        this.handleStepValidation(this.bundleForm);
        break;
      case 2:
        this.handleStepValidation(this.registrationForm);
        break;
      case 3:
        this.handleStepValidation(this.termsForm);
        break;
      case 4:
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
    if (form.valid) {
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
      email: toAsciiEmail(formValue.email!),
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
          this.registrationEmail.set(requestBody.email);
          this.transitionToStep(this.currentStep() + 1);
        }
      });
  }

  getFinalPageButton(): { text: string; action: () => void } {
    const currentUrl = this.router.url;

    if (currentUrl.includes('/bpa/register')) {
      return {
        text: 'Return to Bioplatforms Australia Data Portal',
        action: () => (window.location.href = this.bpaPlatformUrl),
      };
    } else if (currentUrl.includes('/galaxy/register')) {
      return {
        text: 'Return to Galaxy Australia',
        action: () => (window.location.href = 'http://dev.gvl.org.au/'),
      };
    } else {
      return {
        text: 'Login',
        action: () => this.router.navigate(['/login']),
      };
    }
  }
}
