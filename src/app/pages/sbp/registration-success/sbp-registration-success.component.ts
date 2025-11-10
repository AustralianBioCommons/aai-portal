import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  environment,
  environmentDefaults,
} from '../../../../environments/environment';
import { Router } from '@angular/router';
import { resolveRegistrationEmail } from '../../../shared/utils/registration-email';

@Component({
  selector: 'app-registration-success',
  imports: [ButtonComponent],
  templateUrl: './sbp-registration-success.component.html',
  styleUrl: './sbp-registration-success.component.css',
})
export class SbpRegistrationSuccessComponent {
  private router = inject(Router);
  protected readonly registrationEmail = resolveRegistrationEmail(this.router);

  navigateToSBP(): void {
    const sbpUrl =
      environment.platformUrls.sbpPlatform ??
      environmentDefaults.platformUrls.sbpPlatform;

    if (sbpUrl) {
      window.location.href = sbpUrl;
    }
  }
}
