import { Component, inject, signal } from '@angular/core';
import { ApiService, Resource } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-access',
  imports: [RouterModule, LoadingSpinnerComponent],
  templateUrl: './access.component.html',
  styleUrl: './access.component.css',
})
export class AccessComponent {
  approvedResources: Resource[] = [];
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(ApiService);
  private authService = inject(AuthService);

  constructor() {
    toObservable(this.authService.isAuthenticated)
      .pipe(
        takeUntilDestroyed(),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.api.getApprovedResources()),
      )
      .subscribe({
        next: (res) => {
          this.approvedResources = res.approved_resources || [];
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to retrieve approved resources', error);
          this.error.set('Failed to load approved resources');
          this.loading.set(false);
        },
      });
  }
}
