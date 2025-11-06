import { Component } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  environment,
  environmentDefaults,
} from '../../../../environments/environment';

@Component({
  selector: 'app-registration-success',
  imports: [ButtonComponent],
  templateUrl: './sbp-registration-success.component.html',
  styleUrl: './sbp-registration-success.component.css',
})
export class SbpRegistrationSuccessComponent {
  navigateToSBP(): void {
    const sbpUrl =
      environment.platformUrls.sbpPlatform ??
      environmentDefaults.platformUrls.sbpPlatform;

    if (sbpUrl) {
      window.location.href = sbpUrl;
    }
  }
}
