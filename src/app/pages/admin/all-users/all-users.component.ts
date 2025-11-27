import { Component, inject } from '@angular/core';
import {
  AdminGetUsersApiParams,
  ApiService,
} from '../../../core/services/api.service';
import { UserListComponent } from '../components/user-list/user-list.component';

@Component({
  selector: 'app-all-users',
  imports: [UserListComponent],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.css',
})
export class AllUsersComponent {
  private apiService = inject(ApiService);

  title = 'All Users';
  defaultQueryParams: Partial<AdminGetUsersApiParams> = {};
}
