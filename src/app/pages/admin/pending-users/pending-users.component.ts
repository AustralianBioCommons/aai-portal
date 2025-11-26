import { Component, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { UserListComponent } from '../components/user-list/user-list.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-pending-users',
  imports: [UserListComponent],
  templateUrl: './pending-users.component.html',
  styleUrl: './pending-users.component.css',
})
export class PendingUsersComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  title = 'Pending Requests';

  // Display pending platform requests if admin is an SBP platform admin, and bundle requests otherwise
  getUsers = this.authService.adminPlatforms().some((p) => p.id === 'sbp')
    ? this.apiService.getPlatformAdminPendingUsers.bind(this.apiService)
    : this.apiService.getGroupAdminPendingUsers.bind(this.apiService);
}
