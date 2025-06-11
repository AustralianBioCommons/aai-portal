import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';

interface Organization {
  id: string;
  name: string;
  selected: boolean;
}

interface RegistrationRequest {
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
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './bpa-register.component.html',
  styleUrl: './bpa-register.component.css',
})
export class BpaRegisterComponent implements OnInit, OnDestroy {
  private readonly errorNotificationTimeout = 5000;
  private readonly backendURL = `${environment.auth0.backend}/bpa/register`;

  private formBuilder = inject(FormBuilder);
  private document = inject(DOCUMENT);
  private http = inject(HttpClient);
  private router = inject(Router);
  private titleService = inject(Title);

  errorNotification = signal<string | null>(null);

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

  private defaultFavicon: string | null = null;

  // Validator to require a password with at least 8 characters including a lower-case letter, an upper-case letter, and a number
  private passwordValidator = Validators.compose([
    Validators.required,
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
  ]);

  private confirmPasswordValidator = (): ValidationErrors | null => {
    const password = this.registrationForm?.get('password')?.value;
    const confirm = this.registrationForm?.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };

  registrationForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    fullname: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    reason: ['', [Validators.required]],
    password: ['', this.passwordValidator],
    confirmPassword: ['', [Validators.required, this.confirmPasswordValidator]],
    organizations: this.formBuilder.group(
      this.organizations.reduce(
        (acc, org) => ({ ...acc, [org.id]: [false] }),
        {},
      ),
    ),
  });

  constructor() {
    this.titleService.setTitle('Register | Bioplatforms Australia Data Portal');
  }

  ngOnInit(): void {
    this.defaultFavicon =
      this.document.querySelector("link[rel*='icon']")?.getAttribute('href') ||
      null;
    this.setFavicon('/assets/bpa-favicon.ico');
  }

  ngOnDestroy(): void {
    if (this.defaultFavicon) {
      this.setFavicon(this.defaultFavicon);
    }
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
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
        next: () => this.router.navigate(['/bpa/registration-success']),
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

  private setFavicon(href: string): void {
    const links = this.document.querySelectorAll("link[rel*='icon']");
    links.forEach((link) => link.setAttribute('href', href));
  }
}
