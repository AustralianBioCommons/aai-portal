import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-email-verification-required',
  imports: [CommonModule, RecaptchaModule, ButtonComponent, RouterLink],
  templateUrl: './email-verification-required.component.html',
  styleUrl: './email-verification-required.component.css',
})
export class EmailVerificationRequiredComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);

  readonly recaptchaSiteKeyV2 = environment.recaptcha.siteKeyV2;
  readonly sessionToken = signal<string | null>(null);
  readonly recaptchaToken = signal<string | null>(null);
  readonly recaptchaAttempted = signal(false);
  readonly state = signal<'ready' | 'submitting' | 'success' | 'error'>(
    'ready',
  );
  readonly errorMessage = signal<string | null>(null);
  readonly userEmail = signal<string | null>(null);

  readonly maskedEmail = computed(() => {
    const email = this.userEmail();
    if (!email) {
      return null;
    }
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return null;
    }
    return `${local[0]}***@${domain}`;
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('session_token');
    if (!token) {
      this.state.set('error');
      this.errorMessage.set('Invalid or missing session token.');
      return;
    }

    this.sessionToken.set(token);
    const payload = this.decodeJwtPayload(token);
    this.userEmail.set((payload?.['email'] as string) ?? null);
  }

  resolved(captchaResponse: string | null): void {
    this.recaptchaToken.set(captchaResponse);
  }

  resendVerificationEmail(): void {
    this.recaptchaAttempted.set(true);
    if (this.state() === 'submitting') {
      return;
    }

    const token = this.sessionToken();
    if (!token) {
      this.state.set('error');
      this.errorMessage.set('Invalid or missing session token.');
      return;
    }

    const recaptcha = this.recaptchaToken();
    if (!recaptcha) {
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    this.apiService.resendOwnVerificationEmail(token, recaptcha).subscribe({
      next: () => {
        this.state.set('success');
      },
      error: (err) => {
        this.state.set('error');
        this.errorMessage.set(
          err?.error?.detail ||
            'Unable to resend verification email. Please try again.',
        );
      },
    });
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;

      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
