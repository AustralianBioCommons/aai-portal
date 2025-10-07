import { Component, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { UserListComponent } from '../components/user-list/user-list.component';

@Component({
  selector: 'app-pending-users',
  imports: [UserListComponent],
  templateUrl: './pending-users.component.html',
  styleUrl: './pending-users.component.css',
})
export class PendingUsersComponent {
  private apiService = inject(ApiService);

  title = 'Pending Requests';
  getUsers = this.apiService.getAdminPendingUsers.bind(this.apiService);
}
