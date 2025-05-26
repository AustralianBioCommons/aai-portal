import { Component, computed, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type AppId = 'bpa' | 'galaxy';

@Component({
  selector: 'app-email-verified',
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.css'],
  standalone: true,
})
export class EmailVerifiedComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);

  readonly emailVerified = signal(false);
  readonly errorMessage = signal('');

  private readonly title = computed(() => {
    const status = this.emailVerified() ? 'Successful' : 'Failed';
    return `Email Verification | ${status}`;
  });

  readonly appUrls: Record<AppId, string> = {
    bpa: 'https://aaidemo.bioplatforms.com',
    galaxy: 'https://galaxy.test.biocommons.org.au',
  } as const;

  constructor() {
    this.titleService.setTitle('Email Verification');
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      // You may not get email_verified directly unless you're handling it yourself
      // In that case, consider this page is ONLY reached after success
      this.emailVerified.set(params.get('success') === 'true'); // Considered verified if redirected here
      this.errorMessage.set(params.get('message') || '');
      this.titleService.setTitle(this.title());
    });
  }
}
