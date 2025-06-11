import { Component, computed, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type AppId = 'bpa' | 'galaxy' | 'biocommons';

interface UserInfoResponse {
  app: AppId;
  // Add any other expected fields if needed
}

@Component({
  selector: 'app-email-verified',
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.css'],
  standalone: true,
})
export class EmailVerifiedComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly http = inject(HttpClient);

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
    this.titleService.setTitle('Email Verification');
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.emailVerified.set(params.get('success') === 'true');
      this.errorMessage.set(params.get('message') || '');
      this.userEmail.set(params.get('email') || '');
      this.titleService.setTitle(this.title());

      if (this.userEmail()) {
        this.getAppInfo(this.userEmail());
      }
    });
  }

  getAppInfo(email: string): void {
    this.http.get<UserInfoResponse>(`${environment.auth0.backend}/utils/registration_info?user_email=${encodeURIComponent(email)}`)
      .subscribe({
        next: (data) => {
          this.appId.set(data.app);
          this.appUrl.set(this.appUrls[this.appId()])
        },
        error: (err) => {
          console.error(`Failed to fetch app info: ${err}`);
        }
      });
  }
}
