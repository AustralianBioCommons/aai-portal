import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  environment,
  environmentDefaults,
} from '../../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration-success',
  imports: [ButtonComponent],
  templateUrl: './sbp-registration-success.component.html',
  styleUrl: './sbp-registration-success.component.css',
})
export class SbpRegistrationSuccessComponent {
  private router = inject(Router);
  protected readonly registrationEmail = this.resolveRegistrationEmail();

  navigateToSBP(): void {
    const sbpUrl =
      environment.platformUrls.sbpPlatform ??
      environmentDefaults.platformUrls.sbpPlatform;

    if (sbpUrl) {
      window.location.href = sbpUrl;
    }
  }

  private resolveRegistrationEmail(): string | null {
    const navEmail =
      this.router.getCurrentNavigation()?.extras.state?.['email'];
    if (typeof navEmail === 'string') {
      return navEmail;
    }
    if (typeof window !== 'undefined') {
      const historyEmail = window.history?.state?.email;
      if (typeof historyEmail === 'string') {
        return historyEmail;
      }
    }
    return null;
  }
}
