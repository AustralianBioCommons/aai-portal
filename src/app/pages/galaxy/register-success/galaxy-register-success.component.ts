import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { resolveRegistrationEmail } from '../../../shared/utils/registration-email';

@Component({
  selector: 'app-register-success',
  imports: [ButtonComponent],
  templateUrl: './galaxy-register-success.component.html',
  styleUrl: './galaxy-register-success.component.css',
})
export class GalaxyRegisterSuccessComponent {
  private router = inject(Router);
  protected readonly registrationEmail = resolveRegistrationEmail(this.router);

  navigateToGalaxy(): void {
    window.location.href = 'http://dev.gvl.org.au/';
  }
}
