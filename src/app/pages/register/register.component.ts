import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, fromEvent, of } from 'rxjs';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { environment } from '../../../environments/environment';
import { BIOCOMMONS_BUNDLES } from '../../core/constants/constants';
import { ValidationService } from '../../core/services/validation.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RegistrationNavbarComponent } from '../../shared/components/registration-navbar/registration-navbar.component';
import {
  emailLengthValidator,
  internationalEmailValidator,
  toAsciiEmail,
} from '../../shared/validators/emails';
import { fullNameLengthValidator } from '../../shared/validators/full-name';
import { passwordRequirements } from '../../shared/validators/passwords';
import { usernameRequirements } from '../../shared/validators/usernames';

export interface RegistrationForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  bundle: FormControl<string>;
  terms: FormControl<boolean>;
}

interface RegistrationRequest {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  bundle?: string;
}

interface Section {
  id: string;
  label: string;
  mobileLabel: string;
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
export class RegisterComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly validationService = inject(ValidationService);
  private readonly http = inject(HttpClient);

  private readonly bpaPlatformUrl =
    environment.platformUrls.bpaPlatform.replace(/\/+$/, '');
  private readonly galaxyPlatformUrl =
    environment.platformUrls.galaxyPlatform.replace(/\/+$/, '');
  readonly bundles = BIOCOMMONS_BUNDLES;
  readonly recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  readonly sections: Section[] = [
    { id: 'introduction', label: 'Introduction', mobileLabel: 'Introduction' },
    { id: 'your-details', label: 'Your Details', mobileLabel: 'Details' },
    { id: 'add-bundle', label: 'Add a Bundle', mobileLabel: 'Bundle' },
    { id: 'terms', label: 'Accept T&Cs', mobileLabel: 'T&Cs' },
  ];

  recaptchaToken = signal<string | null>(null);
  recaptchaAttempted = signal(false);

  errorAlert = signal<string | null>(null);
  registrationEmail = signal<string | null>(null);
  isSubmitting = signal(false);
  isRegistrationComplete = signal(false);

  activeSection = signal<string>('introduction');
  visitedSections = signal<Set<string>>(new Set(['introduction']));

  registrationForm: FormGroup<RegistrationForm> =
    this.formBuilder.nonNullable.group(
      {
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
        bundle: [''],
        terms: [false, Validators.requiredTrue],
      },
      { validators: fullNameLengthValidator() },
    );

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );

    this.registrationForm
      .get('username')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.validationService.hasFieldBackendError('username'))
          this.validationService.clearFieldBackendError('username');
      });

    this.registrationForm
      .get('email')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.validationService.hasFieldBackendError('email'))
          this.validationService.clearFieldBackendError('email');
      });

    fromEvent(window, 'scroll')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.updateActiveSection();
      });
  }

  ngAfterViewInit(): void {
    this.updateActiveSection();
  }

  private updateActiveSection(): void {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Set the scroll threshold 1/3 of the viewport
    const scrollThreshold = scrollPosition + windowHeight / 3;

    let currentSectionIndex = 0;

    // If we're near the bottom of the page, activate the last section
    if (scrollPosition + windowHeight >= documentHeight - 50) {
      currentSectionIndex = this.sections.length - 1;
      this.activeSection.set(this.sections[currentSectionIndex].id);

      // Mark all sections as visited
      this.visitedSections.update(
        () => new Set(this.sections.map((s) => s.id)),
      );
      return;
    }

    // Find the current section based on scroll position
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];
      const element = document.getElementById(section.id);
      if (element && element.offsetTop <= scrollThreshold) {
        currentSectionIndex = i;
        this.activeSection.set(section.id);

        // Mark this section and all previous sections as visited
        this.visitedSections.update((visited) => {
          const newVisited = new Set(visited);
          for (let j = 0; j <= i; j++) {
            newVisited.add(this.sections[j].id);
          }
          return newVisited;
        });
        return;
      }
    }
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 160; // Offset for navbar and progress bar
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    }
  }

  getActiveStepObject(): Section | undefined {
    return this.sections.find((s) => s.id === this.activeSection());
  }

  isSectionCompleted(sectionId: string): boolean {
    const currentIndex = this.sections.findIndex(
      (s) => s.id === this.activeSection(),
    );
    const sectionIndex = this.sections.findIndex((s) => s.id === sectionId);
    return this.isSectionVisited(sectionId) && sectionIndex < currentIndex;
  }

  isSectionVisited(sectionId: string): boolean {
    return this.visitedSections().has(sectionId);
  }

  isSectionActive(sectionId: string): boolean {
    return this.activeSection() === sectionId;
  }

  isSectionValid(sectionId: string): boolean {
    switch (sectionId) {
      case 'introduction':
        return true;
      case 'your-details':
        return (
          this.areDetailsFieldsValid() &&
          !this.validationService.hasBackendErrors()
        );
      case 'add-bundle':
        return true;
      case 'terms':
        return this.registrationForm.get('terms')?.valid ?? false;
      default:
        return false;
    }
  }

  private areDetailsFieldsValid(): boolean {
    const fields: (keyof RegistrationForm)[] = [
      'firstName',
      'lastName',
      'email',
      'username',
      'password',
      'confirmPassword',
    ];
    return fields.every((field) => this.registrationForm.get(field)?.valid);
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
  }

  toggleBundle(bundleId: string): void {
    const selected = this.bundles.find((b) => b.id === bundleId);
    if (selected?.disabled) return;

    const current = this.registrationForm.get('bundle')?.value;
    this.registrationForm.patchValue({
      bundle: current === bundleId ? '' : bundleId,
    });
  }

  onBundleItemClick(event: Event): void {
    if (event.target instanceof HTMLAnchorElement) {
      event.stopPropagation();
    }
  }

  submitRegistration(): void {
    this.errorAlert.set(null);
    this.recaptchaAttempted.set(true);
    this.registrationForm.markAllAsTouched();

    if (
      !this.recaptchaToken() ||
      !this.registrationForm.valid ||
      this.validationService.hasBackendErrors()
    ) {
      this.scrollToFirstError();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.registrationForm.getRawValue();

    const requestBody: RegistrationRequest = {
      first_name: formValue.firstName,
      last_name: formValue.lastName,
      email: toAsciiEmail(formValue.email),
      username: formValue.username,
      password: formValue.password,
    };

    if (formValue.bundle) requestBody.bundle = formValue.bundle;

    this.http
      .post(`${environment.auth0.backend}/biocommons/register`, requestBody)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Registration failed:', error);
          this.validationService.setBackendErrorMessages(error);

          const errorMessage =
            error?.error?.message || 'Registration failed. Please try again.';

          this.registrationForm.markAllAsTouched();
          this.errorAlert.set(errorMessage);
          this.isSubmitting.set(false);
          this.scrollToFirstError();
          return of(null);
        }),
      )
      .subscribe((result) => {
        this.isSubmitting.set(false);
        if (result) {
          this.registrationEmail.set(requestBody.email);
          this.isRegistrationComplete.set(true);
        }
      });
  }

  private scrollToFirstError(): void {
    for (const fieldName of Object.keys(this.registrationForm.controls)) {
      const control = this.registrationForm.get(fieldName);
      const hasBackendError =
        this.validationService.hasFieldBackendError(fieldName);
      if (control?.invalid || hasBackendError) {
        const element = document.getElementById(fieldName);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }
  }

  toggleTermsAcceptance(): void {
    const currentValue = this.registrationForm.get('terms')?.value;
    this.registrationForm.patchValue({ terms: !currentValue });
  }

  isFieldInvalid(fieldName: keyof RegistrationForm): boolean {
    if (
      (fieldName === 'firstName' || fieldName === 'lastName') &&
      this.registrationForm.hasError('fullNameTooLong') &&
      this.registrationForm.get(fieldName)?.touched
    ) {
      return true;
    }

    return this.validationService.isFieldInvalid(
      this.registrationForm,
      fieldName,
    );
  }

  getErrorMessages(fieldName: keyof RegistrationForm): string[] {
    if (
      (fieldName === 'firstName' || fieldName === 'lastName') &&
      this.registrationForm.hasError('fullNameTooLong') &&
      this.registrationForm.get(fieldName)?.touched
    ) {
      return [
        ...this.validationService.getErrorMessages(
          this.registrationForm,
          fieldName,
        ),
        'Full name must not exceed 255 characters',
      ];
    }

    return this.validationService.getErrorMessages(
      this.registrationForm,
      fieldName,
    );
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
