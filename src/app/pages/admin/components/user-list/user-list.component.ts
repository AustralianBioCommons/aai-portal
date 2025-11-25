import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  model,
  input,
  inject,
  Renderer2,
  effect,
  untracked,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, TitleCasePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { TooltipComponent } from '../../../../shared/components/tooltip/tooltip.component';
import {
  BiocommonsUserResponse,
  FilterOption,
  ApiService,
  AdminGetUsersApiParams,
} from '../../../../core/services/api.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { PlatformId } from '../../../../core/constants/constants';
import { DataRefreshService } from '../../../../core/services/data-refresh.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AuthService } from '../../../../core/services/auth.service';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Reusable user list component with filtering and search.
 *
 * Required inputs:
 * - title: Display heading for the list
 * - getUsers: API method that fetches users. Must accept AdminGetUsersApiParams (page, perPage, filterBy, search, etc.)
 *   and return Observable<BiocommonsUserResponse[]>. Pass a bound ApiService method like apiService.getAllUsers.bind(apiService)
 * - returnUrl: URL to navigate back to from user details page
 *
 * Example: <app-user-list [title]="'All Users'" [getUsers]="apiService.getAllUsers.bind(apiService)" />
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    TitleCasePipe,
    LoadingSpinnerComponent,
    TooltipComponent,
    AlertComponent,
    ModalComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private apiService = inject(ApiService);
  private dataRefreshService = inject(DataRefreshService);
  private authService = inject(AuthService);

  // Cleanup subjects
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Input signals
  title = input.required<string>();
  defaultQueryParams = input.required<Partial<AdminGetUsersApiParams>>();
  returnUrl = input<string>(''); // Optional return URL for navigation back from user details

  // State signals
  loading = signal(false);
  openMenuUserId = signal<string | null>(null);
  alert = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  users = signal<BiocommonsUserResponse[]>([]);
  totalUsers = signal<number>(0);
  page = signal<number>(1);
  totalPages = signal<number>(10);
  searchTerm = model('');
  filterOptions = signal<FilterOption[]>([]);
  selectedFilter = model('');
  showRevokeModal = signal(false);
  selectedUserForRevoke = signal<{
    userId: string;
    email: string;
    platformId: string;
  } | null>(null);

  adminType = this.authService.adminType;
  adminPlatforms = this.authService.adminPlatforms;
  adminGroups = this.authService.adminGroups;

  // Form controls
  revokeReasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    effect(() => {
      const p = this.page();

      // Run the load method without tracking its internal signal reads
      untracked(() => {
        this.loadUsers();
      });
      return p;
    });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['page']) {
        this.page.set(parseInt(params['page'], 10));
      }
    });
    this.loadUserCounts();
    this.loadFilterOptions();
    this.setupSearchDebounce();
    this.setupClickOutsideHandler();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setPage(p: number) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { page: p },
      queryParamsHandling: 'merge', // preserve other filters/sorts
    });
  }

  private setupClickOutsideHandler(): void {
    this.renderer.listen('window', 'click', (e: Event) => {
      const target = e.target as Element;
      if (
        !target.closest('.user-menu-button') &&
        !target.closest('.user-menu-dropdown')
      ) {
        this.openMenuUserId.set(null);
      }
    });
  }

  toggleUserMenu(userId: string): void {
    if (this.openMenuUserId() === userId) {
      this.openMenuUserId.set(null);
    } else {
      this.openMenuUserId.set(userId);
    }
  }

  isMenuOpen(userId: string): boolean {
    return this.openMenuUserId() === userId;
  }

  navigateToUserDetails(userId: string): void {
    this.router.navigate(['/user', userId], {
      state: { returnUrl: this.returnUrl() },
    });
  }

  resendVerificationEmail(userId: string): void {
    this.alert.set(null);

    this.apiService.resendVerificationEmail(userId).subscribe({
      next: () => {
        this.alert.set({
          type: 'success',
          message: 'Verification email sent successfully',
        });
      },
      error: (error) => {
        console.error('Failed to resend verification email:', error);
        this.alert.set({
          type: 'error',
          message: 'Failed to resend verification email',
        });
      },
    });

    this.openMenuUserId.set(null);
  }

  canManageGroup(groupId: string): boolean {
    return this.adminGroups().some((g) => g.id === groupId);
  }

  openRevokeModal(userId: string, email: string, platformId: string): void {
    this.selectedUserForRevoke.set({ userId, email, platformId });
    this.revokeReasonControl.reset();
    this.showRevokeModal.set(true);
    this.openMenuUserId.set(null);
  }

  closeRevokeModal(): void {
    this.showRevokeModal.set(false);
    this.revokeReasonControl.reset();
    this.selectedUserForRevoke.set(null);
  }

  confirmRevokePlatformAccess(): void {
    const selectedUser = this.selectedUserForRevoke();
    this.revokeReasonControl.markAsTouched();

    if (!selectedUser || this.revokeReasonControl.invalid) {
      return;
    }

    const reason = this.revokeReasonControl.value.trim();
    this.alert.set(null);
    this.apiService
      .revokePlatformAccess(
        selectedUser.userId,
        selectedUser.platformId as PlatformId,
        reason,
      )
      .subscribe({
        next: () => {
          this.alert.set({
            type: 'success',
            message: 'User revoked successfully',
          });
          this.closeRevokeModal();
          this.loadUsers();
          // Trigger refresh for navbar
          this.dataRefreshService.triggerRefresh();
        },
        error: (error) => {
          console.error('Failed to revoke user:', error);
          this.alert.set({
            type: 'error',
            message: 'Failed to revoke user',
          });
          this.closeRevokeModal();
        },
      });
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

  loadUserCounts(): void {
    this.apiService
      .getAdminUserCount({
        ...this.defaultQueryParams(),
        page: this.page(),
        perPage: DEFAULT_PAGE_SIZE,
        filterBy: this.selectedFilter(),
        search: this.searchTerm(),
      })
      .subscribe({
        next: (counts) => {
          this.totalPages.set(counts.pages);
          this.totalUsers.set(counts.total);
        },
        error: (error) => {
          console.error('Error loading total pages:', error);
        },
      });
  }

  getUsers() {
    return this.apiService.getAdminAllUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.apiService
      .getAdminAllUsers({
        ...this.defaultQueryParams(),
        page: this.page(),
        perPage: DEFAULT_PAGE_SIZE,
        filterBy: this.selectedFilter(),
        search: this.searchTerm(),
      })
      .subscribe({
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
    this.page.set(1);
    this.loadUserCounts();
    this.loadUsers();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm());
  }
}
