import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  heroShieldCheck,
  heroShieldExclamation,
} from '@ng-icons/heroicons/outline';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-first-migration',
  imports: [NgIcon, LoadingSpinnerComponent],
  templateUrl: './first-migration.component.html',
  styleUrl: './first-migration.component.css',
  viewProviders: [provideIcons({ heroShieldCheck, heroShieldExclamation })],
})
export class FirstMigrationComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  user = this.authService.user;
  sessionToken = signal<string | null>(null);
  // Client ID user logged in via, to be sent to backend
  clientId = signal<string | null>(null);
  state = signal<'success' | 'error' | 'loading'>('loading');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('session_token');
    const clientIdParam = this.route.snapshot.queryParamMap.get('client_id');

    if (!token) {
      this.state.set('error');
      return;
    }

    this.sessionToken.set(token);
    this.clientId.set(clientIdParam || environment.auth0.clientId);

    this.apiService
      .sendMigrationResetPassword(token, this.clientId()!)
      .subscribe({
        next: () => this.state.set('success'),
        error: (err) => {
          this.state.set('error');
          console.error('Error:', err);
        },
      });
  }
}
