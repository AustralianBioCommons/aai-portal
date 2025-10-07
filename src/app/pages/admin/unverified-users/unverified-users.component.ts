import { Component, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { UserListComponent } from '../components/user-list/user-list.component';

@Component({
  selector: 'app-unverified-users',
  imports: [UserListComponent],
  templateUrl: './unverified-users.component.html',
  styleUrl: './unverified-users.component.css',
})
export class UnverifiedUsersComponent {
  private apiService = inject(ApiService);

  title = 'Unverified Users';
  getUsers = this.apiService.getAdminUnverifiedUsers.bind(this.apiService);
}
