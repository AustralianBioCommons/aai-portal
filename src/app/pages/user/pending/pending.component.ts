import { Component, inject, signal } from '@angular/core';
import { ApiService, Pending } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-pending',
  imports: [LoadingSpinnerComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css',
})
export class PendingComponent {
  pendingItems!: Pending;
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(ApiService);
  private authService = inject(AuthService);

  constructor() {
    toObservable(this.authService.isAuthenticated)
      .pipe(
        takeUntilDestroyed(),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.api.getAllPending()),
      )
      .subscribe({
        next: (res) => {
          this.pendingItems = res;
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to retrieve pending requests', error);
          this.error.set('Failed to load pending requests');
          this.loading.set(false);
        },
      });
  }

  get pendingItemsArray() {
    return [
      ...(this.pendingItems.pending_services || []),
      ...(this.pendingItems.pending_resources || []),
    ];
  }
}
