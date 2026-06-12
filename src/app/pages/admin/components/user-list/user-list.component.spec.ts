import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';

import { DEFAULT_PAGE_SIZE, UserListComponent } from './user-list.component';
import {
  ApiService,
  AdminPlatformResponse,
  AdminGroupResponse,
  BiocommonsUserResponse,
  FilterOption,
} from '../../../../core/services/api.service';
import { DataRefreshService } from '../../../../core/services/data-refresh.service';
import { PlatformId } from '../../../../core/constants/constants';
import {
  AdminType,
  AuthService,
  BiocommonsAuth0User,
} from '../../../../core/services/auth.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let adminTypeSignal: WritableSignal<AdminType>;
  let adminPlatformsSignal: WritableSignal<AdminPlatformResponse[]>;
  let adminGroupsSignal: WritableSignal<AdminGroupResponse[]>;
  let userSignal: WritableSignal<BiocommonsAuth0User | null>;
  let router: Router;

  const currentUserSub = 'auth0|admin123';

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

    adminTypeSignal = signal<AdminType>(null);
    adminPlatformsSignal = signal<AdminPlatformResponse[]>([]);
    adminGroupsSignal = signal<AdminGroupResponse[]>([]);
    userSignal = signal<BiocommonsAuth0User | null>({
      sub: currentUserSub,
    } as BiocommonsAuth0User);
    mockAuthService = jasmine.createSpyObj('AuthService', ['refreshUser'], {
      adminPlatforms: adminPlatformsSignal,
      adminGroups: adminGroupsSignal,
      adminType: adminTypeSignal,
      user: userSignal,
    });

    await TestBed.configureTestingModule({
      imports: [UserListComponent, FormsModule],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture.componentRef.setInput('title', 'Test Users');
    fixture.componentRef.setInput('defaultQueryParams', {});
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load filter options on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    expect(mockApiService.getFilterOptions).toHaveBeenCalled();
    expect(component.filterOptions()).toEqual(mockFilterOptions);
  }));

  it('should load users on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: '',
    });
    expect(component.users()).toEqual(mockUsers);
    expect(component.loading()).toBe(false);
  }));

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
      fixture.debugElement.nativeElement.querySelector('.text-gray-300');
    expect(countElement.textContent).toContain('57 users');
  });

  it('should set loading state while loading users', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    expect(component.loading()).toBe(false);
    component.loadUsers();
    expect(component.loading()).toBeTrue();
    tick(250);
    expect(component.loading()).toBe(false);
  }));

  it('should handle error when loading users', fakeAsync(() => {
    mockApiService.getAdminAllUsers.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    spyOn(console, 'error');
    component.loadUsers();

    tick(250);
    expect(component.users()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(console.error).toHaveBeenCalled();
  }));

  it('should handle error when loading filter options', fakeAsync(() => {
    mockApiService.getFilterOptions.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    spyOn(console, 'error');
    fixture.detectChanges();
    tick(250);

    expect(component.filterOptions()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  }));

  it('should filter users based on search term', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    mockApiService.getAdminAllUsers.calls.reset();

    component.searchTerm.set('user1');
    component.onSearchInput();

    tick(700);
    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: 'user1',
    });
  }));

  it('should filter users based on selected filter', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    mockApiService.getAdminAllUsers.calls.reset();

    component.selectedFilter.set('group1');
    component.onFilterChange();

    tick();
    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: 'group1',
      search: '',
    });
  }));

  it('should reset search term when filter changes', () => {
    fixture.detectChanges();

    component.searchTerm.set('test');
    component.onFilterChange();

    expect(component.searchTerm()).toBe('test');
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
    fixture.componentRef.setInput('returnUrl', '/pending-users');
    fixture.detectChanges();

    component.navigateToUserDetails('123');

    expect(router.navigate).toHaveBeenCalledWith(['/user', '123'], {
      state: {
        returnUrl: '/pending-users',
        searchTerm: '',
        selectedFilter: '',
      },
    });
  });

  it('should navigate to user details with empty returnUrl when not provided', () => {
    fixture.detectChanges();

    component.navigateToUserDetails('123');

    expect(router.navigate).toHaveBeenCalledWith(['/user', '123'], {
      state: { returnUrl: '', searchTerm: '', selectedFilter: '' },
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
    it('should append next page on infinite scroll', fakeAsync(() => {
      const page1Users = mockUsers;
      const page2Users: BiocommonsUserResponse[] = [
        {
          id: '3',
          email: 'user3@example.com',
          username: 'user3',
          email_verified: true,
          created_at: '2023-01-03T00:00:00Z',
          platform_memberships: [],
          group_memberships: [],
        },
      ];
      mockApiService.getAdminAllUsers.and.returnValues(
        of(page1Users),
        of(page2Users),
      );
      mockApiService.getAdminUsersPageInfo.and.returnValue(
        of({ total: 3, pages: 2, per_page: 50 }),
      );

      fixture.detectChanges();
      tick(250); // allow min loading delay

      expect(component.users().length).toBe(2);
      // Simulate scroll near bottom
      Object.defineProperty(window, 'innerHeight', { value: 1000 });
      Object.defineProperty(window, 'scrollY', { value: 1000, writable: true });
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        value: 1800,
        configurable: true,
      });

      component.loadNextPage();
      expect(component.loadingMore()).toBeTrue();
      tick(250);

      expect(component.page()).toBe(2);
      expect(component.users().length).toBe(3);
      expect(component.loadingMore()).toBeFalse();
    }));

    it('should not load beyond last page', fakeAsync(() => {
      mockApiService.getAdminUsersPageInfo.and.returnValue(
        of({ total: 2, pages: 1, per_page: 50 }),
      );
      fixture.detectChanges();
      tick(250);

      mockApiService.getAdminAllUsers.calls.reset();
      component.loadNextPage();
      tick(250);

      expect(mockApiService.getAdminAllUsers).not.toHaveBeenCalled();
      expect(component.page()).toBe(1);
    }));

    it('shows no users when API returns empty list', fakeAsync(() => {
      mockApiService.getAdminAllUsers.and.returnValue(of([]));
      mockApiService.getAdminUsersPageInfo.and.returnValue(
        of({ total: 0, pages: 0, per_page: 50 }),
      );

      fixture.detectChanges();
      tick(250);

      expect(component.users().length).toBe(0);
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('current admin user entry', () => {
    const approvedGalaxyMembership = {
      id: 'membership-1',
      platform_id: 'galaxy' as PlatformId,
      platform_name: 'Galaxy Australia',
      user_id: currentUserSub,
      approval_status: 'approved' as const,
      updated_by: 'admin',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const adminUserEntry: BiocommonsUserResponse = {
      id: currentUserSub,
      email: 'admin@example.com',
      username: 'admin',
      email_verified: true,
      created_at: '2023-01-01T00:00:00Z',
      platform_memberships: [approvedGalaxyMembership],
      group_memberships: [],
    };

    const otherUserEntry: BiocommonsUserResponse = {
      id: 'auth0|other456',
      email: 'other@example.com',
      username: 'other',
      email_verified: true,
      created_at: '2023-01-02T00:00:00Z',
      platform_memberships: [
        {
          ...approvedGalaxyMembership,
          id: 'membership-2',
          user_id: 'auth0|other456',
        },
      ],
      group_memberships: [],
    };

    beforeEach(() => {
      adminTypeSignal.set('platform');
      adminPlatformsSignal.set([{ id: 'galaxy', name: 'Galaxy Australia' }]);
      mockApiService.getAdminAllUsers.and.returnValue(
        of([adminUserEntry, otherUserEntry]),
      );
    });

    function getUserRows(): HTMLElement[] {
      return Array.from(
        fixture.debugElement.nativeElement.querySelectorAll(
          '.divide-y > div',
        ) as NodeListOf<HTMLElement>,
      );
    }

    it('should identify the current admin user entry', () => {
      expect(component.isCurrentAdminUser(currentUserSub)).toBeTrue();
      expect(component.isCurrentAdminUser('auth0|other456')).toBeFalse();
    });

    it('should navigate to the profile page when clicking own entry', () => {
      fixture.detectChanges();

      component.navigateToUserDetails(currentUserSub);

      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should highlight the own entry row and show a You badge', fakeAsync(() => {
      fixture.detectChanges();
      tick(250);
      fixture.detectChanges();

      const [adminRow, otherRow] = getUserRows();
      expect(adminRow.textContent).toContain('admin@example.com');
      expect(adminRow.classList).toContain('bg-amber-50');
      expect(adminRow.textContent).toContain('You');
      expect(otherRow.classList).not.toContain('bg-amber-50');
      expect(otherRow.textContent).not.toContain('You');
    }));

    it('should not show the Revoke option in the own entry menu', fakeAsync(() => {
      fixture.detectChanges();
      tick(250);

      component.openMenuUserId.set(currentUserSub);
      fixture.detectChanges();
      const [adminRow] = getUserRows();
      expect(adminRow.textContent).not.toContain('Revoke');
      expect(adminRow.textContent).toContain('View My Profile');

      component.openMenuUserId.set('auth0|other456');
      fixture.detectChanges();
      const [, otherRow] = getUserRows();
      expect(otherRow.textContent).toContain('Revoke');
      expect(otherRow.textContent).toContain('View User Details');
    }));
  });

  describe('getPendingTooltipMessage', () => {
    beforeEach(() => fixture.detectChanges());

    it('returns reason only when no timestamp', () => {
      expect(component.getPendingTooltipMessage('My reason', undefined)).toBe(
        'Reason for request: My reason',
      );
    });

    it('returns formatted timestamp only when no reason', () => {
      const result = component.getPendingTooltipMessage(
        undefined,
        '2024-06-01T10:30:00Z',
      );
      expect(result).toContain('Requested on:');
    });

    it('joins both parts with double newline', () => {
      const result = component.getPendingTooltipMessage(
        'My reason',
        '2024-06-01T10:30:00Z',
      );
      expect(result).toContain('Reason for request: My reason');
      expect(result).toContain('Requested on:');
      expect(result).toContain('\n\n');
    });

    it('returns empty string when both are undefined', () => {
      expect(component.getPendingTooltipMessage(undefined, undefined)).toBe('');
    });
  });
});
