import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, provideRouter, ActivatedRoute, Params } from '@angular/router';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';

import { DEFAULT_PAGE_SIZE, UserListComponent } from './user-list.component';
import {
  ApiService,
  BiocommonsUserResponse,
  FilterOption,
} from '../../../../core/services/api.service';
import { DataRefreshService } from '../../../../core/services/data-refresh.service';
import { PlatformId } from '../../../../core/constants/constants';
import { AuthService } from '../../../../core/services/auth.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let queryParamsSubject: BehaviorSubject<Params>;

  const mockUsers: BiocommonsUserResponse[] = [
    {
      id: '1',
      email: 'user1@example.com',
      username: 'user1',
      email_verified: true,
      created_at: '2023-01-01T00:00:00Z',
      platform_memberships: [],
      group_memberships: [],
    },
    {
      id: '2',
      email: 'user2@example.com',
      username: 'user2',
      email_verified: true,
      created_at: '2023-01-02T00:00:00Z',
      platform_memberships: [],
      group_memberships: [],
    },
  ];

  const mockFilterOptions: FilterOption[] = [
    { id: 'group1', name: 'Group 1' },
    { id: 'group2', name: 'Group 2' },
  ];

  const mockUserCounts = { pages: 2, total: 100, per_page: 50 };

  beforeEach(async () => {
    queryParamsSubject = new BehaviorSubject<Params>({});
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getFilterOptions',
      'resendVerificationEmail',
      'revokePlatformAccess',
      'getAdminAllUsers',
      'getAdminUsersPageInfo',
    ]);
    mockApiService.getFilterOptions.and.returnValue(of(mockFilterOptions));
    mockApiService.resendVerificationEmail.and.returnValue(
      of({ message: 'Email sent' }),
    );
    mockApiService.revokePlatformAccess.and.returnValue(of({ updated: true }));
    mockApiService.getAdminAllUsers.and.returnValue(of(mockUsers));
    mockApiService.getAdminUsersPageInfo.and.returnValue(of(mockUserCounts));

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
      adminGroups: signal([]),
      adminType: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [UserListComponent, FormsModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable(),
            snapshot: { queryParams: {} },
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('title', 'Test Users');
    fixture.componentRef.setInput('defaultQueryParams', {});
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load filter options on init', () => {
    fixture.detectChanges();
    expect(mockApiService.getFilterOptions).toHaveBeenCalled();
    expect(component.filterOptions()).toEqual(mockFilterOptions);
  });

  it('should load users on init', () => {
    fixture.detectChanges();
    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: '',
    });
    expect(component.users()).toEqual(mockUsers);
    expect(component.loading()).toBe(false);
  });

  it('should display the title', () => {
    fixture.detectChanges();
    const titleElement =
      fixture.debugElement.nativeElement.querySelector('.text-3xl');
    expect(titleElement.textContent).toContain('Test Users');
  });

  it('should display user count', () => {
    mockApiService.getAdminUsersPageInfo.and.returnValue(
      of({ total: 57, pages: 2, per_page: 50 }),
    );
    fixture.detectChanges();
    const countElement =
      fixture.debugElement.nativeElement.querySelector('.text-gray-500');
    expect(countElement.textContent).toContain('57 users');
  });

  it('should set loading state while loading users', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
    component.loadUsers();
    expect(component.loading()).toBe(false);
  });

  it('should handle error when loading users', () => {
    mockApiService.getAdminAllUsers.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    spyOn(console, 'error');
    component.loadUsers();

    expect(component.users()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle error when loading filter options', () => {
    mockApiService.getFilterOptions.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    spyOn(console, 'error');
    fixture.detectChanges();

    expect(component.filterOptions()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should filter users based on search term', (done) => {
    fixture.detectChanges();
    mockApiService.getAdminAllUsers.calls.reset();

    component.searchTerm.set('user1');
    component.onSearchInput();

    setTimeout(() => {
      expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: DEFAULT_PAGE_SIZE,
        filterBy: '',
        search: 'user1',
      });
      done();
    }, 600);
  });

  it('should filter users based on selected filter', (done) => {
    fixture.detectChanges();
    mockApiService.getAdminAllUsers.calls.reset();

    component.selectedFilter.set('group1');
    component.onFilterChange();

    setTimeout(() => {
      expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: DEFAULT_PAGE_SIZE,
        filterBy: 'group1',
        search: '',
      });
      done();
    }, 0);
  });

  it('should reset search term when filter changes', () => {
    fixture.detectChanges();

    component.searchTerm.set('test');
    component.onFilterChange();

    expect(component.searchTerm()).toBe('');
  });

  it('should call loadUsers when manually invoked', () => {
    fixture.detectChanges();

    component.loadUsers();

    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: '',
    });
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();

    const destroySpy = spyOn(
      component['destroy$'] as Subject<void>,
      'next',
    ).and.callThrough();
    const completeSpy = spyOn(
      component['destroy$'] as Subject<void>,
      'complete',
    ).and.callThrough();

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should debounce search and not call API multiple times rapidly', (done) => {
    fixture.detectChanges();
    mockApiService.getAdminAllUsers.calls.reset();

    component.searchTerm.set('a');
    component.onSearchInput();

    component.searchTerm.set('ab');
    component.onSearchInput();

    component.searchTerm.set('abc');
    component.onSearchInput();

    setTimeout(() => {
      expect(mockApiService.getAdminAllUsers).toHaveBeenCalledTimes(1);
      expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: DEFAULT_PAGE_SIZE,
        filterBy: '',
        search: 'abc',
      });
      done();
    }, 600);
  });

  it('should not trigger search when the same term is entered (distinctUntilChanged)', fakeAsync(() => {
    fixture.detectChanges();
    mockApiService.getAdminAllUsers.calls.reset();

    component.searchTerm.set('test');
    component.onSearchInput();

    tick(600);

    mockApiService.getAdminAllUsers.calls.reset();

    component.searchTerm.set('test');
    component.onSearchInput();

    tick(600);

    expect(mockApiService.getAdminAllUsers).not.toHaveBeenCalled();
  }));

  it('should navigate to user details with returnUrl state', () => {
    const mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(mockRouter, 'navigate');

    fixture.componentRef.setInput('returnUrl', '/pending-users');
    fixture.detectChanges();

    component.navigateToUserDetails('123');

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user', '123'], {
      state: { returnUrl: '/pending-users' },
    });
  });

  it('should navigate to user details with empty returnUrl when not provided', () => {
    const mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(mockRouter, 'navigate');

    fixture.detectChanges();

    component.navigateToUserDetails('123');

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/user', '123'], {
      state: { returnUrl: '' },
    });
  });

  it('should toggle user menu open and closed', () => {
    fixture.detectChanges();

    component.toggleUserMenu('user1');
    expect(component.isMenuOpen('user1')).toBe(true);

    component.toggleUserMenu('user1');
    expect(component.isMenuOpen('user1')).toBe(false);
  });

  it('should resend verification email successfully', () => {
    fixture.detectChanges();

    component.resendVerificationEmail('123');

    expect(mockApiService.resendVerificationEmail).toHaveBeenCalledWith('123');
    expect(component.alert()).toEqual({
      type: 'success',
      message: 'Verification email sent successfully',
    });
    expect(component.openMenuUserId()).toBeNull();
  });

  it('should handle resend verification email error', () => {
    fixture.detectChanges();
    mockApiService.resendVerificationEmail.and.returnValue(
      throwError(() => new Error('Network error')),
    );

    component.resendVerificationEmail('123');

    expect(mockApiService.resendVerificationEmail).toHaveBeenCalledWith('123');
    expect(component.alert()).toEqual({
      type: 'error',
      message: 'Failed to resend verification email',
    });
    expect(component.openMenuUserId()).toBeNull();
  });

  describe('Revoke Platform Access', () => {
    it('should open revoke modal with correct user data', () => {
      fixture.detectChanges();

      component.openRevokeModal('user123', 'test@example.com', 'platform1');

      expect(component.showRevokeModal()).toBe(true);
      expect(component.selectedUserForRevoke()).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        platformId: 'platform1',
      });
      expect(component.revokeReasonControl.value).toBe('');
      expect(component.openMenuUserId()).toBeNull();
    });

    it('should close revoke modal and reset form', () => {
      fixture.detectChanges();

      component.openRevokeModal('user123', 'test@example.com', 'platform1');
      component.revokeReasonControl.setValue('Test reason');

      component.closeRevokeModal();

      expect(component.showRevokeModal()).toBe(false);
      expect(component.selectedUserForRevoke()).toBeNull();
      expect(component.revokeReasonControl.value).toBe('');
    });

    it('should not confirm revoke when form is invalid', () => {
      fixture.detectChanges();

      component.openRevokeModal('user123', 'test@example.com', 'platform1');

      component.confirmRevokePlatformAccess();

      expect(mockApiService.revokePlatformAccess).not.toHaveBeenCalled();
      expect(component.revokeReasonControl.touched).toBe(true);
    });

    it('should successfully revoke platform access with valid reason', () => {
      const mockDataRefreshService = TestBed.inject(
        DataRefreshService,
      ) as jasmine.SpyObj<DataRefreshService>;
      spyOn(mockDataRefreshService, 'triggerRefresh');

      fixture.detectChanges();

      component.openRevokeModal('user123', 'test@example.com', 'bpa');
      component.revokeReasonControl.setValue('Valid reason');

      component.confirmRevokePlatformAccess();

      expect(mockApiService.revokePlatformAccess).toHaveBeenCalledWith(
        'user123',
        'bpa' as PlatformId,
        'Valid reason',
      );
      expect(component.alert()).toEqual({
        type: 'success',
        message: 'User revoked successfully',
      });
      expect(component.showRevokeModal()).toBe(false);
      expect(mockDataRefreshService.triggerRefresh).toHaveBeenCalled();
    });

    it('should handle revoke platform access error', () => {
      fixture.detectChanges();
      mockApiService.revokePlatformAccess.and.returnValue(
        throwError(() => new Error('Network error')),
      );

      component.openRevokeModal('user123', 'test@example.com', 'bpa');
      component.revokeReasonControl.setValue('Valid reason');

      component.confirmRevokePlatformAccess();

      expect(mockApiService.revokePlatformAccess).toHaveBeenCalled();
      expect(component.alert()).toEqual({
        type: 'error',
        message: 'Failed to revoke user',
      });
      expect(component.showRevokeModal()).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('should navigate to update page query param when setPage is called', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');
      fixture.detectChanges();

      component.setPage(2);

      expect(navigateSpy).toHaveBeenCalledWith([], {
        relativeTo: TestBed.inject(ActivatedRoute),
        queryParams: { page: 2 },
        queryParamsHandling: 'merge',
      });
    });

    it('should load users and counts when page query param changes', fakeAsync(() => {
      fixture.detectChanges(); // Initial load for page 1

      mockApiService.getAdminAllUsers.calls.reset();
      mockApiService.getAdminUsersPageInfo.calls.reset();

      component.setPage(2);

      // Allow effect to run
      tick();
      fixture.detectChanges();

      expect(component.page()).toBe(2);

      expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
        page: 2,
        perPage: DEFAULT_PAGE_SIZE,
        filterBy: '',
        search: '',
      });

      expect(mockApiService.getAdminUsersPageInfo).toHaveBeenCalledWith({
        page: 2,
        perPage: DEFAULT_PAGE_SIZE,
        filterBy: '',
        search: '',
      });
    }));

    it('should reset page when search term changes', fakeAsync(() => {
      component.setPage(2);
      tick();
      fixture.detectChanges();
      expect(component.page()).toBe(2);

      component.searchTerm.set('test');
      component.onSearchInput();
      // Wait for search debounce
      tick(500);
      tick();
      fixture.detectChanges();

      expect(component.page()).toBe(1);
    }));

    it('should reset page when filter changes', () => {
      component.setPage(2);
      fixture.detectChanges();

      component.selectedFilter.set('group1');
      fixture.detectChanges();
      expect(component.page()).toBe(1);
    });
  });
});
