import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);

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

  selectBundle(value: string) {
    this.bundleForm.patchValue({ selectedBundle: value });
  }

  getSelectedBundle(): Bundle | undefined {
    const selectedId = this.bundleForm.get('selectedBundle')?.value;
    return this.bundles.find((bundle) => bundle.id === selectedId);
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
    } else {
      form.markAllAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep === 1) {
      this.router.navigate(['../'], { relativeTo: this.route });
    } else if (this.currentStep > 1) {
      this.currentStep--;
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

  private completeRegistration() {
    console.log('Submitting registration...', {
      bundle: this.bundleForm.value,
      registration: this.registrationForm.value,
      terms: this.termsForm.value,
    });
  }
}
