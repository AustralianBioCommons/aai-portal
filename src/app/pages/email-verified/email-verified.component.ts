import { Component, computed, signal, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrandingService } from '../../core/services/branding.service';
import { ApiService } from '../../core/services/api.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheckCircle, heroXCircle } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-email-verified',
  imports: [ButtonComponent, NgIcon],
  templateUrl: './email-verified.component.html',
  styleUrl: './email-verified.component.css',
  viewProviders: [provideIcons({ heroCheckCircle, heroXCircle })],
})
export class EmailVerifiedComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly brandingService = inject(BrandingService);
  private readonly apiService = inject(ApiService);

  readonly emailVerified = signal(false);
  readonly errorMessage = signal('');
  private readonly welcomeEmailSent = signal(false);

  private readonly title = computed(() => {
    const status = this.emailVerified() ? 'Successful' : 'Failed';
    return `Email Verification | ${status}`;
  });

  constructor() {
    effect(() => {
      this.brandingService.setTitle(this.title());
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const rawSuccess = params.get('success') === 'true';
      const message = params.get('message') || '';
      const alreadyVerified = message === 'This URL can be used only once';
      const success = rawSuccess || alreadyVerified;
      this.emailVerified.set(success);
      this.errorMessage.set(alreadyVerified ? '' : message);
      const rawEmail = params.get('email');
      const email = rawEmail ? decodeURIComponent(rawEmail) : null;
      if (success && email && !this.welcomeEmailSent()) {
        this.welcomeEmailSent.set(true);
        this.apiService.sendWelcomeEmail(email).subscribe({
          error: (error) => {
            console.error('Failed to send welcome email:', error);
          },
        });
      }
    });
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
