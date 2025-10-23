import { Component, signal, OnInit } from '@angular/core';
import { BiocommonsUserDetails } from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {
  PLATFORMS,
  PlatformId,
  biocommonsBundles,
} from '../../../core/constants/constants';

@Component({
  selector: 'app-profile',
  imports: [LoadingSpinnerComponent, AlertComponent, ButtonComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  protected readonly PLATFORMS = PLATFORMS;
  protected readonly biocommonsBundles = biocommonsBundles;

  // State signals
  user = signal<BiocommonsUserDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mock data based on the sample user response
  private mockUser: BiocommonsUserDetails = {
    created_at: '2025-06-02T23:23:30.426000Z',
    email: 'minh@biocommons.org.au',
    username: 'minh-vu',
    email_verified: true,
    identities: [
      {
        connection: 'Username-Password-Authentication',
        provider: 'auth0',
        user_id: '683e32728d230e3bd4f65c71',
        isSocial: false,
      },
    ],
    name: 'Minh Vu',
    nickname: 'minh',
    picture:
      'https://s.gravatar.com/avatar/4b427a6e1fdea8c77f6fb50a72463393?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fmv.png',
    updated_at: '2025-10-17T06:41:33.724000Z',
    user_id: 'auth0|683e32728d230e3bd4f65c71',
    last_ip: '147.161.214.193',
    last_login: '2025-10-17T06:41:33.724000Z',
    logins_count: 202,
    platform_memberships: [
      {
        id: '4812d25e-e3f1-4a83-988d-57c586e2c5ea',
        platform_id: 'galaxy',
        platform_name: 'Galaxy Australia',
        user_id: 'auth0|683e32728d230e3bd4f65c71',
        approval_status: 'approved',
        updated_by: 'minh@biocommons.org.au',
      },
      {
        id: '2ebb5c21-4d3e-43a1-93e3-48f48a323f79',
        platform_id: 'bpa_data_portal',
        platform_name: 'Bioplatforms Australia Data Portal',
        user_id: 'auth0|683e32728d230e3bd4f65c71',
        approval_status: 'approved',
        updated_by: '(automatic)',
      },
      {
        id: 'b49d4519-bce5-400c-9885-32289c6d67b0',
        platform_id: 'sbp',
        platform_name: 'Structural Biology Platform',
        user_id: 'auth0|683e32728d230e3bd4f65c71',
        approval_status: 'approved',
        updated_by: 'minh@biocommons.org.au',
      },
    ],
    group_memberships: [
      {
        id: 'c5155872-ac64-43a8-8fe1-da5c12168d22',
        group_id: 'biocommons/group/tsi',
        group_name: 'Threatened Species Initiative',
        group_short_name: 'TSI',
        approval_status: 'approved',
        updated_by: '(automatic)',
      },
      {
        id: 'a25da85a-72b2-4c92-b2a1-de602912b0f8',
        group_id: 'biocommons/group/bpa_galaxy',
        group_name: 'Bioplatforms Australia Data Portal & Galaxy Australia',
        group_short_name: 'BPA-GA',
        approval_status: 'approved',
        updated_by: '(automatic)',
      },
    ],
  };

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    // Simulate API call with mock data
    setTimeout(() => {
      this.user.set(this.mockUser);
      this.loading.set(false);
    }, 500);

    // TODO: Make API call to get current user's profile
  }

  getPlatformName(platformId: string): string {
    return PLATFORMS[platformId as PlatformId]?.name || platformId;
  }

  getBundleLogoUrls(groupId: string): string[] {
    const bundleId = groupId.split('/').pop() || '';
    const bundle = this.biocommonsBundles.find((b) => b.id === bundleId);
    return bundle?.logoUrls || [];
  }
}
