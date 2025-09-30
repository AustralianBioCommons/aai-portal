import { Component } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-registration-success',
  imports: [ButtonComponent],
  templateUrl: './sbp-registration-success.component.html',
  styleUrl: './sbp-registration-success.component.css',
})
export class SbpRegistrationSuccessComponent {
  navigateToSBP(): void {
    window.location.href = 'https://www.biocommons.org.au/';
  }
}
