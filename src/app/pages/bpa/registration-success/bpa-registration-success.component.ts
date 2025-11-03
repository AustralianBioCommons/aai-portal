import { Component } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-bpa-registration-success',
  imports: [ButtonComponent],
  templateUrl: './bpa-registration-success.component.html',
  styleUrl: './bpa-registration-success.component.css',
})
export class BpaRegistrationSuccessComponent {
  private readonly bpaPlatformUrl =
    environment.platformUrls.bpaPlatform.replace(/\/+$/, '');

  navigateToBPA(): void {
    window.location.href = this.bpaPlatformUrl;
  }
}
