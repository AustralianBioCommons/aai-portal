import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { PendingUsersComponent } from './pending-users.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

describe('PendingUsersComponent', () => {
  let component: PendingUsersComponent;
  let fixture: ComponentFixture<PendingUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  function setupComponent(
    isSbpAdmin = false,
    platformId: 'sbp' | 'galaxy' | null = null,
  ) {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getPlatformAdminPendingUsers',
      'getGroupAdminPendingUsers',
      'getFilterOptions',
    ]);
    mockApiService.getPlatformAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getGroupAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getFilterOptions.and.returnValue(of([]));

    let platforms: { id: string; name: string }[] = [];
    if (isSbpAdmin || platformId === 'sbp') {
      platforms = [{ id: 'sbp', name: 'Structural Biology Platform' }];
    } else if (platformId === 'galaxy') {
      platforms = [{ id: 'galaxy', name: 'Galaxy Australia' }];
    }

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal(platforms),
      adminType: signal(isSbpAdmin || platformId ? 'platform' : 'bundle'),
    });

    TestBed.configureTestingModule({
      imports: [PendingUsersComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(PendingUsersComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    setupComponent();
    expect(component).toBeTruthy();
  });

  it('should set the correct title', () => {
    setupComponent();
    expect(component.title).toBe('Pending Requests');
  });

  it('should bind getUsers to platform API method for SBP platform admin', () => {
    setupComponent(true);

    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getPlatformAdminPendingUsers).toHaveBeenCalledWith(
      params,
    );
    expect(mockApiService.getGroupAdminPendingUsers).not.toHaveBeenCalled();
  });

  it('should bind getUsers to group API method for bundle admins', () => {
    setupComponent(false);

    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getGroupAdminPendingUsers).toHaveBeenCalledWith(
      params,
    );
    expect(mockApiService.getPlatformAdminPendingUsers).not.toHaveBeenCalled();
  });

  it('should bind getUsers to group API method for non-SBP platform admins', () => {
    setupComponent(false, 'galaxy');

    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getGroupAdminPendingUsers).toHaveBeenCalledWith(
      params,
    );
    expect(mockApiService.getPlatformAdminPendingUsers).not.toHaveBeenCalled();
  });
});
