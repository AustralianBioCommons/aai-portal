import { Component, inject, OnInit } from '@angular/core';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { BiocommonsAuth0User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-list-unverified-users',
  imports: [LoadingSpinnerComponent],
  templateUrl: './list-unverified-users.component.html',
  styleUrl: './list-unverified-users.component.css',
})
export class ListUnverifiedUsersComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = false;
  users: BiocommonsAuth0User[] = [];

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getUnverifiedUsers(1, 50).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.loading = false;
      },
    });
  }
}
