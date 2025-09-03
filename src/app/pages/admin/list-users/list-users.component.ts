import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  FilterOption,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-list-users',
  imports: [FormsModule, LoadingSpinnerComponent],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.css',
})
export class ListUsersComponent implements OnInit {
  private apiService = inject(ApiService);

  filterOptions: FilterOption[] = [];
  selectedFilter = '';
  searchTerm = '';
  loading = false;
  users: BiocommonsUserResponse[] = [];

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadUsers();
  }

  private loadFilterOptions(): void {
    this.apiService.getFilterOptions().subscribe({
      next: (options) => {
        this.filterOptions = options;
      },
      error: (error) => {
        console.error('Error loading filter options:', error);
        this.filterOptions = [];
      },
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.apiService
      .getUsers(1, 50, this.selectedFilter || undefined)
      .subscribe({
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
