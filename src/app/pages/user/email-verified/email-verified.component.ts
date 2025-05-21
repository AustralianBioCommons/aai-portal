import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

type AppId = 'bpa' | 'galaxy';

@Component({
  selector: 'app-email-verified',
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.css']
})
export class EmailVerifiedComponent implements OnInit {
  applicationName: string | null = null;
  appId: AppId | null = null;
  appUrl: string | null = null;
  emailVerified = false;
  message = '';
  errorMessage = '';


  app_urls: Record<AppId, string> = {
    'bpa': 'https://aaidemo.bioplatforms.com',
    'galaxy': 'https://galaxy.test.biocommons.org.au'
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.applicationName = params.get('application_name');
      this.setAppIds();
      if (this.appId) {
        this.appUrl = this.app_urls[this.appId];
      }
      // You may not get email_verified directly unless you're handling it yourself
      // In that case, consider this page is ONLY reached after success
      this.emailVerified = params.get('success') === 'true'; // Considered verified if redirected here
      this.errorMessage = params.get('message') || '';
      this.setMessage();
    });
  }

  // Try to set app ID from application name - not 100% robust but allows us to
  // show more info for known apps
  private setAppIds(): void {
    if (this.applicationName?.toLowerCase().includes('bpa')) {
      this.appId = 'bpa';
    } else if (this.applicationName?.toLowerCase().includes('galaxy')) {
      this.appId = 'galaxy';
    }
  }

  private setMessage(): void {
    if (this.emailVerified) {
      this.message = this.applicationName
        ? `Your email has been successfully verified for ${this.applicationName}. You can now log in.`
        : `Your email has been successfully verified. You can now log in.`;
    }
  }
}
