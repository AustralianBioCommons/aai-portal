import { Component, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bpa-register',
  imports: [ReactiveFormsModule, CommonModule],
  standalone: true,
  templateUrl: './bpa-register.component.html',
  styleUrl: './bpa-register.component.css',
})
export class BpaRegisterComponent {
  private formBuilder = inject(FormBuilder);

  checkboxes: string[] = [
    '2024 Fungi Bioinformatics Workshop',
    'ARC for Innovations in Peptide and Protein Science (CIPPS)',
    'Australian Amphibian and Reptile Genomics',
    'Australian Avian Genomics',
    'Australian Fish Genomics',
    'Australian Grasslands Initiative',
    "Fungi Functional 'Omics",
    'Genomics for Forest Resilience',
    'Great Barrier Reef',
    "Integrated Pest Management 'Omics",
    'Oz Mammals Genomics Initiative',
    "Plant Pathogen 'Omics",
    'Plant Protein Atlas',
    'The Australian Microbiome Initiative',
    'Threatened Species Initiative',
    'Wheat Cultivars',
    'Wheat Pathogens Genomes',
    'Wheat Pathogens Transcript',
  ];

  private passwordValidator = Validators.compose([
    Validators.required,
    Validators.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    ),
  ]);

  private confirmPasswordValidator = (): ValidationErrors | null => {
    const password = this.registrationForm?.get('password')?.value;
    const confirm = this.registrationForm?.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };

  private atLeastOneCheckboxValidator(): ValidationErrors | null {
    const organizations = this.registrationForm?.get('organizations');
    if (!organizations) return null;

    const hasChecked = (organizations.value as boolean[]).some(
      (value) => value === true,
    );
    return hasChecked ? null : { requireCheckbox: true };
  }

  registrationForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    fullname: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    reason: ['', [Validators.required]],
    password: ['', this.passwordValidator],
    confirmPassword: ['', [Validators.required, this.confirmPasswordValidator]],
    organizations: this.formBuilder.array(
      this.checkboxes.map(() => false),
      [this.atLeastOneCheckboxValidator.bind(this)],
    ),
  });

  onSubmit(): void {
    if (this.registrationForm.valid) {
      console.log(this.registrationForm.value);
    } else {
      this.registrationForm.markAllAsTouched();

      const firstInvalidField = Object.keys(
        this.registrationForm.controls,
      ).find((key) => this.registrationForm.get(key)?.invalid);

      if (firstInvalidField) {
        const element = document.getElementById(firstInvalidField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  isOrganizationsInvalid(): boolean {
    const organizations = this.registrationForm.get('organizations');
    return !!(
      organizations?.errors?.['requireCheckbox'] && organizations.touched
    );
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registrationForm.get(fieldName);

    if (control?.errors) {
      if (control.errors['required']) {
        return 'This field is required';
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
      if (fieldName === 'password' && control.errors['pattern']) {
        return 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character';
      }
      if (control.errors['requireCheckbox']) {
        return 'Please select at least one organization';
      }
    }
    return '';
  }
}
