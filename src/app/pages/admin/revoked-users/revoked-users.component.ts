import { Component, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { UserListComponent } from '../components/user-list/user-list.component';

@Component({
  selector: 'app-revoked-users',
  imports: [UserListComponent],
  templateUrl: './revoked-users.component.html',
  styleUrl: './revoked-users.component.css',
})
export class RevokedUsersComponent {
  private apiService = inject(ApiService);

  title = 'Revoked Users';
  getUsers = this.apiService.getAdminRevokedUsers.bind(this.apiService);
}
