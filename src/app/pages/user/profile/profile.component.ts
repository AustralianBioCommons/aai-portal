import { Component, signal, OnInit, inject } from '@angular/core';
import {
  ApiService,
  UserProfileData,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  PLATFORMS,
  PlatformId,
  biocommonsBundles,
} from '../../../core/constants/constants';
import { EditButtonComponent } from './edit-button/edit-button.component';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [
    LoadingSpinnerComponent,
    AlertComponent,
    ButtonComponent,
    EditButtonComponent,
    RouterLink,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  protected readonly PLATFORMS = PLATFORMS;
  protected readonly biocommonsBundles = biocommonsBundles;
  protected readonly platformLaunchUrls: Partial<Record<PlatformId, string>> = {
    bpa_data_portal: environment.platformUrls.bpaPlatform,
    galaxy: environment.platformUrls.galaxyPlatform,
    sbp: environment.platformUrls.sbpPlatform,
  };

  // State signals
  user = signal<UserProfileData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  isGeneralAdmin = this.authService.isGeneralAdmin;

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getUserProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user profile:', err);
        this.error.set('Failed to load user profile');
        this.loading.set(false);
      },
    });
  }

  getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.biocommonsBundles.find((b) => b.id === bundleId);
    return bundle?.logoUrls || [];
  }
}
