import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import {
  Router,
  ActivatedRoute,
  RouterLink,
  NavigationEnd,
} from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

interface BundleService {
  id: string;
  name: string;
  termsUrl: string;
}

interface Bundle {
  id: string;
  name: string;
  services: BundleService[];
}

interface BundleFormData {
  selectedBundle: string;
}

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

type TermsFormData = Record<string, boolean>;

interface RegistrationState {
  currentStep: number;
  bundleFormData: BundleFormData | null;
  registrationFormData: RegistrationFormData | null;
  termsFormData: TermsFormData | null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  private readonly STORAGE_KEY = 'bundle-registration-state';

  currentStep = 1;
  totalSteps = 5;

  bundles: Bundle[] = [
    {
      id: 'data-portal-galaxy',
      name: 'Data Portal and Galaxy',
      services: [
        {
          id: 'bpa',
          name: 'Bioplatforms Australia Data Portal Terms and Conditions',
          termsUrl: 'https://data.bioplatforms.com/',
        },
        {
          id: 'galaxy',
          name: 'Galaxy Australia Terms of Service',
          termsUrl: 'https://site.usegalaxy.org.au/about#terms-of-service',
        },
      ],
    },
    {
      id: 'tsi',
      name: 'Threatened Species Initiative',
      services: [
        {
          id: 'tsi',
          name: 'TSI Terms and Conditions',
          termsUrl: 'https://threatenedspeciesinitiative.com/',
        },
        {
          id: 'bpa',
          name: 'Bioplatforms Australia Data Portal Terms and Conditions',
          termsUrl: 'https://data.bioplatforms.com/',
        },
        {
          id: 'galaxy',
          name: 'Galaxy Australia Terms of Service',
          termsUrl: 'https://site.usegalaxy.org.au/about#terms-of-service',
        },
      ],
    },
  ];

  bundleForm: FormGroup = this.formBuilder.group({
    selectedBundle: ['', Validators.required],
  });

  // Password validator to require at least 8 characters including a lower-case letter, an upper-case letter, and a number
  private passwordValidator = Validators.compose([
    Validators.required,
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
  ]);

  private confirmPasswordValidator = (): ValidationErrors | null => {
    const password = this.registrationForm?.get('password')?.value;
    const confirm = this.registrationForm?.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };

  registrationForm: FormGroup = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required]],
    password: ['', this.passwordValidator],
    confirmPassword: ['', [Validators.required, this.confirmPasswordValidator]],
  });

  termsForm: FormGroup = this.formBuilder.group({});

  ngOnInit() {
    this.loadSavedState();
    this.setupFormSubscriptions();
    this.setupRouteListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteListener() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((event: NavigationEnd) => {
        // Clear state if navigating away from registration routes
        if (!event.url.includes('/register/bundle-access')) {
          this.clearSavedState();
        }
      });
  }

  private loadSavedState() {
    const savedState = localStorage.getItem(this.STORAGE_KEY);
    if (!savedState) return;

    try {
      const state: RegistrationState = JSON.parse(savedState);
      this.currentStep = state.currentStep;
      if (state.bundleFormData) {
        this.bundleForm.patchValue(state.bundleFormData);
      }
      if (state.registrationFormData) {
        this.registrationForm.patchValue(state.registrationFormData);
      }
      if (state.termsFormData && this.currentStep >= 3) {
        this.initializeTermsForm();
        this.termsForm.patchValue(state.termsFormData);
      }
    } catch (error) {
      console.error('Error loading saved registration state:', error);
      this.clearSavedState();
    }
  }

  private saveCurrentState() {
    const state: RegistrationState = {
      currentStep: this.currentStep,
      bundleFormData: this.bundleForm.value as BundleFormData,
      registrationFormData: this.registrationForm.value as RegistrationFormData,
      termsFormData: this.termsForm.value as TermsFormData,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  private clearSavedState() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private setupFormSubscriptions() {
    this.bundleForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveCurrentState();
      });

    this.registrationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveCurrentState();
      });
  }

  selectBundle(value: string) {
    this.bundleForm.patchValue({ selectedBundle: value });
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('selectedBundle')?.value;
    return this.bundles.find((bundle) => bundle.id === selectedId);
  }

  initializeTermsForm() {
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

      this.termsForm.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.saveCurrentState();
        });
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
        this.currentStep++;
        break;
      default:
        if (this.currentStep < this.totalSteps) {
          this.currentStep++;
          this.saveCurrentState();
        }
        break;
    }
  }

  private handleStepValidation(form: FormGroup, onSuccess?: () => void) {
    if (form.valid) {
      if (onSuccess) {
        onSuccess();
      }
      this.currentStep++;
      this.saveCurrentState();
    } else {
      form.markAllAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep === 1) {
      this.clearSavedState(); // Clear saved state when leaving registration
      this.router.navigate(['../'], { relativeTo: this.route });
    } else if (this.currentStep > 1) {
      this.currentStep--;
      this.saveCurrentState();
    }
  }

  toggleTermsAcceptance(serviceId: string) {
    const currentValue = this.termsForm.get(serviceId)?.value;
    this.termsForm.patchValue({ [serviceId]: !currentValue });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registrationForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Please enter a valid email address';
      if (control.errors['passwordMismatch']) return 'Passwords do not match';
      if (fieldName === 'password' && control.errors['pattern']) {
        return 'Password must be at least 8 characters including a lower-case letter, an upper-case letter, and a number';
      }
    }
    return '';
  }

  completeRegistration() {
    console.log('Submitting registration...', {
      bundle: this.bundleForm.value,
      registration: this.registrationForm.value,
      terms: this.termsForm.value,
    });
    this.clearSavedState();
  }
}
