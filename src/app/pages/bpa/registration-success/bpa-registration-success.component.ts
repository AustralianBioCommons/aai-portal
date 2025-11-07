import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bpa-registration-success',
  imports: [ButtonComponent],
  templateUrl: './bpa-registration-success.component.html',
  styleUrl: './bpa-registration-success.component.css',
})
export class BpaRegistrationSuccessComponent {
  private router = inject(Router);
  protected readonly registrationEmail = this.resolveRegistrationEmail();
  private readonly bpaPlatformUrl =
    environment.platformUrls.bpaPlatform.replace(/\/+$/, '');

  navigateToBPA(): void {
    window.location.href = this.bpaPlatformUrl;
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
