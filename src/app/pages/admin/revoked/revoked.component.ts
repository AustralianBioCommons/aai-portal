import { Component, inject } from '@angular/core';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ApiService } from '../../../core/services/api.service';
import { BiocommonsAuth0User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-revoked',
  imports: [LoadingSpinnerComponent],
  templateUrl: './revoked.component.html',
  styleUrl: './revoked.component.css',
})
export class RevokedComponent {
  private apiService = inject(ApiService);

  loading = false;
  users: BiocommonsAuth0User[] = [];

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getRevokedUsers(1, 50).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        ``;
        this.users = [];
        this.loading = false;
      },
    });
  }
}
