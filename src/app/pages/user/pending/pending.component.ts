import { Component, inject, signal } from '@angular/core';
import {
  AllPendingResponse,
  ApiService,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { PLATFORM_NAMES } from '../../../core/constants/constants';

interface PendingItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-pending',
  imports: [LoadingSpinnerComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css',
})
export class PendingComponent {
  pendingItems: AllPendingResponse = { platforms: [], groups: [] };
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(ApiService);
  private authService = inject(AuthService);

  constructor() {
    toObservable(this.authService.isAuthenticated)
      .pipe(
        takeUntilDestroyed(),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.api.getUserAllPending()),
      )
      .subscribe({
        next: (res) => {
          this.pendingItems = res || {
            pending_services: [],
            pending_resources: [],
          };
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to retrieve pending requests', error);
          this.error.set('Failed to load pending requests');
          this.loading.set(false);
          this.pendingItems = { platforms: [], groups: [] };
        },
      });
  }

  get pendingItemsArray(): PendingItem[] {
    if (!this.pendingItems) {
      return [];
    }
    return [
      ...this.pendingItems.platforms.map((platform) => {
        return {
          id: platform.platform_id,
          name: PLATFORM_NAMES[platform.platform_id] || platform.platform_id,
        };
      }),
      ...this.pendingItems.groups.map((group) => {
        return { id: group.group_id, name: group.group_name };
      }),
    ];
  }
}
