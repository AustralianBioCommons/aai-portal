import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  ValidationErrors,
  FormGroup
} from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@auth0/auth0-angular';

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
  private readonly backendURL =
    'https://aaibackend.test.biocommons.org.au/bpa/register';

  private formBuilder = inject(FormBuilder);
  private document = inject(DOCUMENT);
  private http = inject(HttpClient);
  private router = inject(Router);
  private titleService = inject(Title);
  private auth = inject(AuthService);

  errorNotification = signal<string | null>(null);

  registerForm: FormGroup = this.formBuilder.group({
    username: ['', Validators.required],
    fullname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    reason: ['', Validators.required],
    password: ['', Validators.required],
    organizations: this.formBuilder.group({})
  });

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.registerForm.patchValue({ username: user.nickname || user.email });
      }
    });
  }

  ngOnDestroy() {}

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.auth.idToken$.subscribe(idToken => {
      if (idToken) {
        this.http.post(this.backendURL, this.registerForm.value, {
          headers: { Authorization: `Bearer ${idToken}` }
        }).subscribe({
          next: () => this.router.navigate(['/success']),
          error: err => this.errorNotification.set('Registration failed: ' + err.message)
        });
      }
    });
  }
}
