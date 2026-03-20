import { Component, computed, inject } from '@angular/core';
import {
  AdminGetUsersApiParams,
  ApiService,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UserListComponent } from '../components/user-list/user-list.component';

@Component({
  selector: 'app-revoked-users',
  imports: [UserListComponent, LoadingSpinnerComponent],
  templateUrl: './revoked-users.component.html',
  styleUrl: './revoked-users.component.css',
})
export class RevokedUsersComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  title = 'Revoked Users';
  adminType = this.authService.adminType;
  adminPlatforms = this.authService.adminPlatforms;

  defaultQueryParams = computed<Partial<AdminGetUsersApiParams> | null>(() => {
    const adminType = this.adminType();

    if (!adminType) {
      return null;
    }

    if (adminType === 'platform') {
      const platformId = this.adminPlatforms()[0]?.id;
      if (!platformId) {
        return null;
      }
      return {
        platform: platformId,
        platformApprovalStatus: 'revoked',
      };
    }

    return { approvalStatus: 'revoked' };
  });
}
