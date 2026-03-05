import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  sessionToken = signal<string | null>(null);
  state = signal<'success' | 'error' | 'loading'>('loading');

  userEmail = signal<string | null>(null);
  maskedEmail = computed(() => {
    const email = this.userEmail();
    if (!email) return null;
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('session_token');
    // Client ID user logged in via, to be sent to backend
    const clientId =
      this.route.snapshot.queryParamMap.get('client_id') ||
      environment.auth0.clientId;

    if (!token) {
      this.state.set('error');
      return;
    }

    this.sessionToken.set(token);

    const payload = this.decodeJwtPayload(token);
    this.userEmail.set((payload?.['email'] as string) ?? null);

    this.apiService.sendMigrationResetPassword(token, clientId).subscribe({
      next: () => this.state.set('success'),
      error: (err) => {
        this.state.set('error');
        console.error('Error:', err);
      },
    });
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;

      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
