import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-button',
  imports: [],
  standalone: true,
  templateUrl: './login-button.component.html',
  styleUrl: './login-button.component.css',
})
export class LoginButtonComponent {
  private auth = inject(AuthService);

  login() {
    this.auth.login();
  }
}
