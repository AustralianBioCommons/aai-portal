import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { environment } from '../../../environments/environment';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { usernameRequirements } from '../../shared/validators/usernames';
import { jwtDecode } from 'jwt-decode';

interface AafRegisterToken {
  purpose: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

interface AafRegisterForm {
  email: FormControl<string>;
  name: FormControl<string>;
  username: FormControl<string>;
}

interface AafRegistrationRequest {
  session_token: string;
  username: string;
  bundles: [];
  recaptcha_token: string;
}

@Component({
  selector: 'app-aaf-register',
  imports: [
    ReactiveFormsModule,
    RecaptchaModule,
    AlertComponent,
    ButtonComponent,
    RouterLink,
  ],
  templateUrl: './aaf-register.component.html',
  styleUrl: './aaf-register.component.css',
})
export class AafRegisterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  readonly sessionToken = signal<string | null>(null);
  readonly recaptchaToken = signal<string | null>(null);
  readonly recaptchaAttempted = signal(false);
  readonly errorAlert = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly isRegistrationComplete = signal(false);

  readonly aafRegisterForm: FormGroup<AafRegisterForm> =
    this.formBuilder.nonNullable.group({
      email: [''],
      name: [''],
      username: ['', usernameRequirements],
    });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('session_token');
    if (!token) {
      this.errorAlert.set('Invalid or missing session token.');
      return;
    }

    this.sessionToken.set(token);
    const payload = this.decodeJwtPayload(token);
    const email = (payload?.['email'] as string | undefined) ?? '';
    const givenName = (payload?.['given_name'] as string | undefined) ?? '';
    const familyName = (payload?.['family_name'] as string | undefined) ?? '';
    const fullName = (payload?.['name'] as string | undefined) ?? '';
    const displayName =
      fullName || [givenName, familyName].filter(Boolean).join(' ');

    this.aafRegisterForm.patchValue({
      email,
      name: displayName,
    });
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
  }

  submitRegistration(): void {
    this.errorAlert.set(null);
    this.recaptchaAttempted.set(true);
    this.aafRegisterForm.markAllAsTouched();

    const sessionToken = this.sessionToken();
    const recaptcha = this.recaptchaToken();
    if (!sessionToken) {
      this.errorAlert.set('Invalid or missing session token.');
      return;
    }
    if (!recaptcha || this.aafRegisterForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const requestBody: AafRegistrationRequest = {
      session_token: sessionToken,
      username: this.aafRegisterForm.getRawValue().username,
      bundles: [],
      recaptcha_token: recaptcha,
    };

    this.http
      .post(`${environment.auth0.backend}/biocommons/register-aaf`, requestBody)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('AAF registration failed:', error);
          this.errorAlert.set(
            error?.error?.message ||
              error?.error?.detail ||
              'AAF registration failed. Please try again.',
          );
          this.isSubmitting.set(false);
          return of(null);
        }),
      )
      .subscribe((result) => {
        this.isSubmitting.set(false);
        if (result) {
          this.isRegistrationComplete.set(true);
        }
      });
  }

  /*
   Decode the token sent by Auth0 so we can display email/name prefilled.
   Note we can't validate the token properly here, that's handled by
   the backend when we send the token on
   */
  private decodeJwtPayload(token: string): AafRegisterToken | null {
    return jwtDecode<AafRegisterToken>(token);
  }
}
