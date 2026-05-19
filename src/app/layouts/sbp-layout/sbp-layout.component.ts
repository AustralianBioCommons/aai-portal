import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { RegistrationNavbarComponent } from '../../shared/components/registration-navbar/registration-navbar.component';

@Component({
  selector: 'app-sbp-layout',
  imports: [RouterOutlet, RegistrationNavbarComponent],
  templateUrl: './sbp-layout.component.html',
  styleUrl: './sbp-layout.component.css',
})
export class SbpLayoutComponent {
  router = inject(Router);
}
