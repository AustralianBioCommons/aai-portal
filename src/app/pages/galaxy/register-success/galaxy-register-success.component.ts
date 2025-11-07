import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-success',
  imports: [ButtonComponent],
  templateUrl: './galaxy-register-success.component.html',
  styleUrl: './galaxy-register-success.component.css',
})
export class GalaxyRegisterSuccessComponent {
  private router = inject(Router);
  protected readonly registrationEmail = this.resolveRegistrationEmail();

  navigateToGalaxy(): void {
    window.location.href = 'http://dev.gvl.org.au/';
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
