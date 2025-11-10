import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { resolveRegistrationEmail } from '../../../shared/utils/registration-email';

@Component({
  selector: 'app-bpa-registration-success',
  imports: [ButtonComponent],
  templateUrl: './bpa-registration-success.component.html',
  styleUrl: './bpa-registration-success.component.css',
})
export class BpaRegistrationSuccessComponent {
  private router = inject(Router);
  protected readonly registrationEmail = resolveRegistrationEmail(this.router);
  private readonly bpaPlatformUrl =
    environment.platformUrls.bpaPlatform.replace(/\/+$/, '');

  navigateToBPA(): void {
    window.location.href = this.bpaPlatformUrl;
  }
}
