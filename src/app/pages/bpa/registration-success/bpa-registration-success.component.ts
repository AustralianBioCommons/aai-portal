import { Component } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-bpa-registration-success',
  imports: [ButtonComponent],
  templateUrl: './bpa-registration-success.component.html',
  styleUrl: './bpa-registration-success.component.css',
})
export class BpaRegistrationSuccessComponent {
  navigateToBPA(): void {
    window.location.href = 'https://aaidemo.bioplatforms.com/';
  }
}
