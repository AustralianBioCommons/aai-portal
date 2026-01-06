import { Component, inject } from '@angular/core';
import {
  AdminGetUsersApiParams,
  ApiService,
} from '../../../core/services/api.service';
import { UserListComponent } from '../components/user-list/user-list.component';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-unverified-users',
  imports: [UserListComponent],
  templateUrl: './unverified-users.component.html',
  styleUrl: './unverified-users.component.css',
})
export class UnverifiedUsersComponent {
  private apiService = inject(ApiService);
  private document = inject(DOCUMENT);

  title = 'Unverified Users';
  defaultQueryParams: Partial<AdminGetUsersApiParams> = {
    emailVerified: false,
  };

  refreshPage() {
    this.document.location.reload();
  }
}
