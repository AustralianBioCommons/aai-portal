import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { usernameRequirements } from '../../../../utils/validation/usernames';
import { passwordRequirements } from '../../../../utils/validation/passwords';
import { ValidationService } from '../../../core/services/validation.service';
import { RecaptchaModule } from 'ng-recaptcha-2';

interface Organization {
  id: string;
  name: string;
  selected: boolean;
}

export interface RegistrationRequest {
  username: string;
  fullname: string;
  email: string;
  reason: string;
  password: string;
  organizations: Record<string, boolean>;
}

@Component({
  selector: 'app-bpa-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, RecaptchaModule],
  templateUrl: './bpa-register.component.html',
  styleUrl: './bpa-register.component.css',
})
export class BpaRegisterComponent {
  private readonly errorNotificationTimeout = 5000;
  private readonly backendURL = `${environment.auth0.backend}/bpa/register`;

  private formBuilder = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private validationService = inject(ValidationService);
  private route = inject(ActivatedRoute);

  errorNotification = signal<string | null>(null);

  recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  recaptchaToken: string | null = null;
  recaptchaAttempted = false;

  organizations: Organization[] = [
    {
      id: 'bpa-bioinformatics-workshop',
      name: '2024 Fungi Bioinformatics Workshop',
      selected: false,
    },
    {
      id: 'cipps',
      name: 'ARC for Innovations in Peptide and Protein Science (CIPPS)',
      selected: false,
    },
    {
      id: 'ausarg',
      name: 'Australian Amphibian and Reptile Genomics',
      selected: false,
    },
    { id: 'aus-avian', name: 'Australian Avian Genomics', selected: false },
    { id: 'aus-fish', name: 'Australian Fish Genomics', selected: false },
    {
      id: 'grasslands',
      name: 'Australian Grasslands Initiative',
      selected: false,
    },
    { id: 'fungi', name: "Fungi Functional 'Omics", selected: false },
    {
      id: 'forest-resilience',
      name: 'Genomics for Forest Resilience',
      selected: false,
    },
    {
      id: 'bpa-great-barrier-reef',
      name: 'Great Barrier Reef',
      selected: false,
    },
    {
      id: 'bpa-ipm',
      name: "Integrated Pest Management 'Omics",
      selected: false,
    },
    { id: 'bpa-omg', name: 'Oz Mammals Genomics Initiative', selected: false },
    { id: 'plant-pathogen', name: "Plant Pathogen 'Omics", selected: false },
    { id: 'ppa', name: 'Plant Protein Atlas', selected: false },
    {
      id: 'australian-microbiome',
      name: 'The Australian Microbiome Initiative',
      selected: false,
    },
    {
      id: 'threatened-species',
      name: 'Threatened Species Initiative',
      selected: false,
    },
    { id: 'bpa-wheat-cultivars', name: 'Wheat Cultivars', selected: false },
    {
      id: 'bpa-wheat-pathogens-genomes',
      name: 'Wheat Pathogens Genomes',
      selected: false,
    },
    {
      id: 'bpa-wheat-pathogens-transcript',
      name: 'Wheat Pathogens Transcript',
      selected: false,
    },
  ];

  registrationForm = this.formBuilder.group({
    username: ['', [usernameRequirements]],
    fullname: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    reason: ['', [Validators.required]],
    password: ['', passwordRequirements],
    confirmPassword: ['', [Validators.required]],
    organizations: this.formBuilder.group(
      this.organizations.reduce(
        (acc, org) => ({ ...acc, [org.id]: [false] }),
        {},
      ),
    ),
  });

  constructor() {
    this.validationService.setupPasswordConfirmationValidation(
      this.registrationForm,
    );
  }

  onSubmit(): void {
    this.recaptchaAttempted = true;
    if (this.registrationForm.valid && this.recaptchaToken) {
      const formValue = this.registrationForm.value;
      const requestBody: RegistrationRequest = {
        username: formValue.username || '',
        fullname: formValue.fullname || '',
        email: formValue.email || '',
        reason: formValue.reason || '',
        password: formValue.password || '',
        organizations: formValue.organizations || {},
      };

      this.http.post(this.backendURL, requestBody).subscribe({
        next: () =>
          this.router.navigate(['success'], { relativeTo: this.route }),
        error: (error) => this.showErrorNotification(error?.error?.detail),
      });
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

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken = captchaResponse;
  }

  resetForm(): void {
    this.registrationForm.reset({
      username: '',
      fullname: '',
      email: '',
      reason: '',
      password: '',
      confirmPassword: '',
      organizations: this.organizations.reduce(
        (acc, org) => ({ ...acc, [org.id]: false }),
        {},
      ),
    });
    this.registrationForm.markAsPristine();
    this.registrationForm.markAsUntouched();
    this.recaptchaToken = null;
    this.recaptchaAttempted = false;
  }

  showErrorNotification(message: string): void {
    this.errorNotification.set(message);
    setTimeout(
      () => this.errorNotification.set(null),
      this.errorNotificationTimeout,
    );
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isFieldInvalid(fieldName: string): boolean {
    return this.validationService.isFieldInvalid(
      this.registrationForm,
      fieldName,
    );
  }

  getErrorMessages(
    fieldName: keyof RegistrationRequest | 'confirmPassword',
  ): string[] {
    return this.validationService.getErrorMessages(
      this.registrationForm,
      fieldName,
    );
  }
}
