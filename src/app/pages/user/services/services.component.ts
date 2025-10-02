import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import {
  ApiService,
  PlatformUserResponse,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { PLATFORM_NAMES } from '../../../core/constants/constants';

@Component({
  selector: 'app-services',
  imports: [RouterLink, RouterModule, LoadingSpinnerComponent],
  standalone: true,
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
})
export class ServicesComponent {
  approvedPlatforms: PlatformUserResponse[] = [];
  loading = signal(true);
  error = signal<string | null>(null);

  private api = inject(ApiService);
  private authService = inject(AuthService);

  constructor() {
    toObservable(this.authService.isAuthenticated)
      .pipe(
        takeUntilDestroyed(),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.api.getUserApprovedPlatforms()),
      )
      .subscribe({
        next: (res) => {
          this.approvedPlatforms = res || [];
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to retrieve approved platforms', error);
          this.error.set('Failed to load approved platforms.');
          this.loading.set(false);
        },
      });
  }

  protected readonly PLATFORM_NAMES = PLATFORM_NAMES;
}
