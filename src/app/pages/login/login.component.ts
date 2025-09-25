import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, LoadingSpinnerComponent, AlertComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);

  authError = this.authService.authError;
  isAutoLoggingIn = signal(false);

  /**
   * Auto-login flow: Check if we're returning from a logout that was triggered by an auth error.
   * This prevents the user from having to click "login" twice when there are authentication issues.
   */
  ngOnInit() {
    const shouldAutoLogin = sessionStorage.getItem('auth_error_logout');
    if (shouldAutoLogin === 'true') {
      this.isAutoLoggingIn.set(true);
      sessionStorage.removeItem('auth_error_logout');
      this.authService.login();
      return;
    }
  }

  /**
   * Handle login
   * When there's an authentication error -> Logout to clear Auth0 session -> Auto-login on return
   * Step 1: Set flag so we know to auto-login when we return from logout
   * Step 2: Logout will redirect to Auth0's /v2/logout, then back to our login page
   * Step 3: ngOnInit will detect the flag and automatically call login() again
   */
  handleLogin() {
    if (this.authError()) {
      sessionStorage.setItem('auth_error_logout', 'true');
      this.authService.logout();
    } else {
      this.authService.login();
    }
  }
}
