import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  model,
  input,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {
  BiocommonsUserResponse,
  FilterOption,
  ApiService,
} from '../../../../core/services/api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent, RouterLink],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  // Input signals
  title = input.required<string>();
  getUsers =
    input.required<
      (
        page?: number,
        pageSize?: number,
        filterBy?: string,
        search?: string,
      ) => Observable<BiocommonsUserResponse[]>
    >();

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // State signals
  loading = signal(false);
  users = signal<BiocommonsUserResponse[]>([]);
  filterOptions = signal<FilterOption[]>([]);
  selectedFilter = model('');
  searchTerm = model('');

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
      next: (options: FilterOption[]) => {
        this.filterOptions.set(options);
      },
      error: (error: unknown) => {
        console.error('Error loading filter options:', error);
        this.filterOptions.set([]);
      },
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.getUsers()(
      1,
      50,
      this.selectedFilter() || undefined,
      this.searchTerm() || undefined,
    ).subscribe({
      next: (users: BiocommonsUserResponse[]) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Error loading users:', error);
        this.users.set([]);
        this.loading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.searchTerm.set('');
    this.loadUsers();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm());
  }
}
