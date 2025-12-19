import { Component, inject } from '@angular/core';
import {
  AdminGetUsersApiParams,
  ApiService,
} from '../../../core/services/api.service';
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
  defaultQueryParams: Partial<AdminGetUsersApiParams> = {
    emailVerified: false,
  };

  refreshPage() {
    window.location.reload();
  }
}
