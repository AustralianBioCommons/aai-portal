import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { BUNDLES, Bundle } from '../../core/constants/constants';
import { ALLOWED_SPECIAL_CHARACTERS, passwordRequirements } from '../../../utils/validation/passwords';
import { usernameRequirements } from '../../../utils/validation/usernames';

interface RegistrationForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [ReactiveFormsModule, CommonModule],
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);

  currentStep = 1;
  totalSteps = 5;

  bundles: Bundle[] = BUNDLES;

  bundleForm: FormGroup = this.formBuilder.group({
    selectedBundle: ['', Validators.required],
  });

  private confirmPasswordValidator = (): ValidationErrors | null => {
    const password = this.registrationForm?.get('password')?.value;
    const confirm = this.registrationForm?.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };

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
      password: this.formBuilder.nonNullable.control(
        '',
        passwordRequirements,
      ),
      confirmPassword: this.formBuilder.nonNullable.control('', [
        Validators.required,
        this.confirmPasswordValidator,
      ]),
    });

  termsForm: FormGroup = this.formBuilder.group({});

  constructor() {
    this.registrationForm.get('password')?.valueChanges.subscribe(() => {
      this.registrationForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  selectBundle(value: string) {
    this.bundleForm.patchValue({ selectedBundle: value });
  }

  login() {
    this.authService.login();
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

  getErrorMessages(fieldName: keyof RegistrationForm): string[] {
    const control = this.registrationForm.get(fieldName);
    if (!control?.errors) return [];

    const errorMessages: Partial<Record<keyof RegistrationForm | "default", Record<string, string>>> = {
      'default': {
        'required': 'This field is required',
        'email': 'Please enter a valid email address',
        'passwordMismatch': 'Passwords do not match',
      },
      'password': {
        'passwordMismatch': 'Passwords do not match',
        'minlength': 'Password must be at least 8 characters',
        'maxlength': 'Password cannot be longer than 128 characters',
        'lowercaseRequired': 'Password must contain at least one lowercase letter',
        'uppercaseRequired': 'Password must contain at least one uppercase letter',
        'digitRequired': 'Password must contain at least one digit',
        'specialCharacterRequired': `Password must contain at least one special character (${ALLOWED_SPECIAL_CHARACTERS})`
      },
      'username': {
        'minlength': 'Your username needs at least 3 characters',
        'maxlength': 'Your username cannot be longer than 100 characters',
        'pattern': 'Your username should contain only lower-case letters, numbers, dots, underscores and dashes',
      }
    };

    // Return all error messages that apply to this control
    return Object.keys(control.errors)
      .filter(key =>
        errorMessages[fieldName]?.[key] || errorMessages['default']?.[key]
      )
      .map(key =>
        errorMessages[fieldName]?.[key] || errorMessages['default']?.[key] || `Error: ${key}`
      );

  }

  private completeRegistration() {
    console.log('Submitting registration...', {
      bundle: this.bundleForm.value,
      registration: this.registrationForm.value,
      terms: this.termsForm.value,
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
