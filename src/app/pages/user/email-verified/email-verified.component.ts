import { Component, computed, signal, inject, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BrandingService } from '../../../core/services/branding.service';

type AppId = 'bpa' | 'galaxy' | 'biocommons';

interface UserInfoResponse {
  app: AppId;
  // Add any other expected fields if needed
}

@Component({
  selector: 'app-email-verified',
  templateUrl: './email-verified.component.html',
  styleUrl: './email-verified.component.css',
})
export class EmailVerifiedComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly brandingService = inject(BrandingService);

  readonly appUrls: Record<AppId, string> = {
    bpa: 'https://aaidemo.bioplatforms.com',
    galaxy: 'https://galaxy.test.biocommons.org.au',
    biocommons: 'https://login.test.biocommons.org.au',
  } as const;

  readonly emailVerified = signal(false);
  readonly userEmail = signal('');
  readonly errorMessage = signal('');
  readonly appId = signal<AppId>('biocommons');
  readonly appUrl = signal(this.appUrls['biocommons']);

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
      this.userEmail.set(params.get('email') || '');

      if (this.userEmail()) {
        this.getAppInfo(this.userEmail());
      }
    });
  }

  getAppInfo(email: string): void {
    this.http
      .get<UserInfoResponse>(
        `${environment.auth0.backend}/utils/registration_info?user_email=${encodeURIComponent(email)}`,
      )
      .subscribe({
        next: (data) => {
          this.appId.set(data.app);
          this.appUrl.set(this.appUrls[this.appId()]);
        },
        error: (err) => {
          console.error(`Failed to fetch app info: ${err}`);
        },
      });
  }
}
