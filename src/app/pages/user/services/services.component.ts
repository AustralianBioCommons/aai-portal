import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { ApiService, Service } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-services',
  imports: [RouterLink, RouterModule, LoadingSpinnerComponent],
  standalone: true,
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
})
export class ServicesComponent {
  approvedServices: Service[] = [];
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(ApiService);
  private authService = inject(AuthService);

  constructor() {
    toObservable(this.authService.isAuthenticated)
      .pipe(
        takeUntilDestroyed(),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.api.getApprovedServices()),
      )
      .subscribe({
        next: (res) => {
          this.approvedServices = res.approved_services || [];
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to retrieve approved services', error);
          this.error.set('Failed to load approved services');
          this.loading.set(false);
        },
      });
  }
}
