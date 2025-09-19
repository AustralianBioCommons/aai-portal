import { Component, inject, OnInit } from '@angular/core';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import {
  ApiService,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';
import { BiocommonsAuth0User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-revoked',
  imports: [LoadingSpinnerComponent],
  templateUrl: './revoked.component.html',
  styleUrl: './revoked.component.css',
})
export class RevokedComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = true;
  users: BiocommonsUserResponse[] = [];

  ngOnInit(): void {
    this.apiService.getAdminRevokedUsers(1, 50).subscribe({
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
