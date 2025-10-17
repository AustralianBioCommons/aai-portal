import { Component } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-register-success',
  imports: [ButtonComponent],
  templateUrl: './galaxy-register-success.component.html',
  styleUrl: './galaxy-register-success.component.css',
})
export class GalaxyRegisterSuccessComponent {
  navigateToGalaxy(): void {
    window.location.href = 'http://dev.gvl.org.au/';
  }
}
