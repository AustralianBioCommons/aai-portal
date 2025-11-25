import { Component, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { UserListComponent } from '../components/user-list/user-list.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-revoked-users',
  imports: [UserListComponent],
  templateUrl: './revoked-users.component.html',
  styleUrl: './revoked-users.component.css',
})
export class RevokedUsersComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  title = 'Revoked Users';

  getUsers =
    this.authService.adminType() === 'bundle'
      ? this.apiService.getGroupAdminRevokedUsers.bind(this.apiService)
      : this.apiService.getPlatformAdminRevokedUsers.bind(this.apiService);
}
