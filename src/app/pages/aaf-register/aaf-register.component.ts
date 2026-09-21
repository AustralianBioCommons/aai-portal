import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { environment } from '../../../environments/environment';
import { BIOCOMMONS_BUNDLES } from '../../core/constants/constants';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  BundleSelectionComponent,
  BundleSelections,
} from '../../shared/components/bundle-selection/bundle-selection.component';
import { usernameRequirements } from '../../shared/validators/usernames';

interface AafRegisterToken {
  purpose: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

interface AafRegisterForm {
  email: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  username: FormControl<string>;
  bundles: FormControl<BundleSelections>;
  terms: FormControl<boolean>;
}

interface BundleRequest {
  bundle_id: string;
  reason?: string;
}

interface AafRegistrationRequest {
  session_token: string;
  state: string;
  username: string;
  bundles: BundleRequest[];
  recaptcha_token: string;
}

interface AafRegistrationResponse {
  message?: string;
  redirect_url?: string;
}

@Component({
  selector: 'app-aaf-register',
  imports: [
    ReactiveFormsModule,
    RecaptchaModule,
    AlertComponent,
    ButtonComponent,
    BundleSelectionComponent,
    RouterLink,
  ],
  templateUrl: './aaf-register.component.html',
  styleUrl: './aaf-register.component.css',
})
export class AafRegisterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  readonly bundles = BIOCOMMONS_BUNDLES;
  readonly recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  readonly sessionToken = signal<string | null>(null);
  readonly authState = signal<string | null>(null);
  readonly recaptchaToken = signal<string | null>(null);
  readonly recaptchaAttempted = signal(false);
  readonly errorAlert = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly isRegistrationComplete = signal(false);

  readonly aafRegisterForm: FormGroup<AafRegisterForm> =
    this.formBuilder.nonNullable.group({
      // email / firstName / lastName come from AAF (rendered read-only).
      email: [''],
      firstName: [''],
      lastName: [''],
      username: ['', usernameRequirements],
      bundles: new FormControl<BundleSelections>({} as BundleSelections, {
        nonNullable: true,
      }),
      terms: [false, Validators.requiredTrue],
    });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('session_token');
    const state = this.route.snapshot.queryParamMap.get('state');
    // Both are required to complete registration and resume the Auth0 login.
    if (!token || !state) {
      this.errorAlert.set(
        'Invalid or missing registration link. Please try logging in again.',
      );
      return;
    }

    this.sessionToken.set(token);
    this.authState.set(state);

    const payload = this.decodeJwtPayload(token);
    const [fallbackFirst, ...fallbackRest] = (payload?.name ?? '').split(' ');
    this.aafRegisterForm.patchValue({
      email: payload?.email ?? '',
      firstName: payload?.given_name || fallbackFirst || '',
      lastName: payload?.family_name || fallbackRest.join(' ') || '',
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
    const state = this.authState();
    const recaptcha = this.recaptchaToken();
    if (!sessionToken || !state) {
      this.errorAlert.set(
        'Invalid or missing registration link. Please try logging in again.',
      );
      return;
    }
    if (!recaptcha || this.aafRegisterForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    const selections = this.aafRegisterForm.getRawValue().bundles ?? {};
    const bundles: BundleRequest[] = Object.entries(selections).map(
      ([bundle_id, reason]) => ({
        bundle_id,
        ...(reason ? { reason } : {}),
      }),
    );
    const requestBody: AafRegistrationRequest = {
      session_token: sessionToken,
      state,
      username: this.aafRegisterForm.getRawValue().username,
      bundles,
      recaptcha_token: recaptcha,
    };

    this.http
      .post<AafRegistrationResponse>(
        `${environment.auth0.backend}/biocommons/register-aaf`,
        requestBody,
      )
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
        if (!result) {
          this.isSubmitting.set(false);
          return;
        }
        // Resume the Auth0 login by following the signed /continue URL returned
        // by the backend. Full-page navigation so the redirect chain runs.
        if (result.redirect_url) {
          this.document.location.href = result.redirect_url;
          return;
        }
        // Defensive fallback: registration succeeded but no continue URL came
        // back. Show a completion message rather than leaving the user stuck.
        this.isSubmitting.set(false);
        this.isRegistrationComplete.set(true);
      });
  }

  /*
   Decode the token sent by Auth0 so we can display email/name prefilled.
   Not validated here (only for display) — the backend verifies the token when
   we send it on.
   */
  private decodeJwtPayload(token: string): AafRegisterToken | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(padded)) as AafRegisterToken;
    } catch {
      return null;
    }
  }
}
