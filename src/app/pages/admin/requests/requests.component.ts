import { Component, inject, OnInit } from '@angular/core';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import {
  ApiService,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';
import { BiocommonsAuth0User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-requests',
  imports: [LoadingSpinnerComponent],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.css',
})
export class RequestsComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = false;
  users: BiocommonsUserResponse[] = [];

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getAdminPendingUsers(1, 50).subscribe({
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
