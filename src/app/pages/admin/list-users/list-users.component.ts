import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ApiService,
  FilterOption,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-list-users',
  imports: [FormsModule, LoadingSpinnerComponent, RouterLink],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.css',
})
export class ListUsersComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  filterOptions: FilterOption[] = [];
  selectedFilter = '';
  searchTerm = '';
  loading = false;
  users: BiocommonsUserResponse[] = [];

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadUsers();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadUsers();
      });
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
      .getUsers(
        1,
        50,
        this.selectedFilter || undefined,
        this.searchTerm || undefined,
      )
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

  onFilterChange(): void {
    this.searchTerm = '';
    this.loadUsers();
  }

  onSearch(): void {
    this.loadUsers();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
}
