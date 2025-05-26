import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

type AppId = 'bpa' | 'galaxy';

@Component({
  selector: 'app-email-verified',
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.css']
})
export class EmailVerifiedComponent implements OnInit {
  emailVerified = false;
  errorMessage = '';

  app_urls: Record<AppId, string> = {
    'bpa': 'https://aaidemo.bioplatforms.com',
    'galaxy': 'https://galaxy.test.biocommons.org.au'
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      // You may not get email_verified directly unless you're handling it yourself
      // In that case, consider this page is ONLY reached after success
      this.emailVerified = params.get('success') === 'true'; // Considered verified if redirected here
      this.errorMessage = params.get('message') || '';
    });
  }

}
