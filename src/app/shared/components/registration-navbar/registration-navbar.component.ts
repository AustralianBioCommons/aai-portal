import { Component } from '@angular/core';

@Component({
  selector: 'app-registration-navbar',
  imports: [],
  templateUrl: './registration-navbar.component.html',
  styleUrl: './registration-navbar.component.css',
})
export class RegistrationNavbarComponent {
  // Keep the logo link on the current host so staging/dev/prod all point to their own portal.
  readonly portalHomeHref = `${window.location.origin}/`;
}
