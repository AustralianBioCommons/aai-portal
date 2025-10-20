import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register-selection',
  imports: [RouterLink, ButtonComponent],
  templateUrl: './bpa-register-selection.component.html',
  styleUrl: './bpa-register-selection.component.css',
})
export class BpaRegisterSelectionComponent {
  private readonly bpaPortalBaseUrl = environment.portals.bpaPortal.replace(
    /\/+$/,
    '',
  );

  readonly bpaLoginUrl = `${this.bpaPortalBaseUrl}/user/login/oidc-pkce`;
}
