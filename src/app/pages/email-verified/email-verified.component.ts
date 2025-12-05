import { Component, computed, signal, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrandingService } from '../../core/services/branding.service';
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

  readonly emailVerified = signal(false);
  readonly errorMessage = signal('');

  private readonly title = computed(() => {
    const status = this.emailVerified() ? 'Successful' : 'Failed';
    return `Email Verification | ${status}`;
  });

  constructor() {
    effect(() => {
      this.brandingService.setTitle(this.title());
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.emailVerified.set(params.get('success') === 'true');
      this.errorMessage.set(params.get('message') || '');
    });
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
