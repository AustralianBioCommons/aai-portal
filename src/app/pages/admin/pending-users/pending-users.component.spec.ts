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

  function setupComponent(adminType: 'platform' | 'bundle' = 'platform') {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getPlatformAdminPendingUsers',
      'getGroupAdminPendingUsers',
      'getFilterOptions',
    ]);
    mockApiService.getPlatformAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getGroupAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getFilterOptions.and.returnValue(of([]));

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
      adminType: signal(adminType),
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

  it('should bind getUsers to platform API method for platform admin', () => {
    setupComponent('platform');

    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getPlatformAdminPendingUsers).toHaveBeenCalledWith(
      params,
    );
    expect(mockApiService.getGroupAdminPendingUsers).not.toHaveBeenCalled();
  });

  it('should bind getUsers to group API method for group admin', () => {
    setupComponent('bundle');

    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getGroupAdminPendingUsers).toHaveBeenCalledWith(
      params,
    );
    expect(mockApiService.getPlatformAdminPendingUsers).not.toHaveBeenCalled();
  });
});
