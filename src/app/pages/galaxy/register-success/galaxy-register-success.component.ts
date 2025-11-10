import { Component } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register-success',
  imports: [ButtonComponent],
  templateUrl: './galaxy-register-success.component.html',
  styleUrl: './galaxy-register-success.component.css',
})
export class GalaxyRegisterSuccessComponent {
  private readonly galaxyPlatformUrl =
    environment.platformUrls.galaxyPlatform.replace(/\/+$/, '');

  navigateToGalaxy(): void {
    window.location.href = this.galaxyPlatformUrl;
  }
}
