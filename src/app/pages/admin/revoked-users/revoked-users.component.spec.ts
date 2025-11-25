import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { RevokedUsersComponent } from './revoked-users.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

describe('RevokedUsersComponent', () => {
  let component: RevokedUsersComponent;
  let fixture: ComponentFixture<RevokedUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  function setupComponent(adminType: 'platform' | 'bundle' = 'platform') {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getPlatformAdminRevokedUsers',
      'getGroupAdminRevokedUsers',
      'getFilterOptions',
    ]);
    mockApiService.getPlatformAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getGroupAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getFilterOptions.and.returnValue(of([]));

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
      adminType: signal(adminType),
    });

    TestBed.configureTestingModule({
      imports: [RevokedUsersComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(RevokedUsersComponent);
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
    expect(component.title).toBe('Revoked Users');
  });

  it('should bind getUsers to platform API method for platform admin', () => {
    setupComponent('platform');

    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getPlatformAdminRevokedUsers).toHaveBeenCalledWith(
      params,
    );
    expect(mockApiService.getGroupAdminRevokedUsers).not.toHaveBeenCalled();
  });

  it('should bind getUsers to group API method for group admin', () => {
    setupComponent('bundle');

    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getGroupAdminRevokedUsers).toHaveBeenCalledWith(
      params,
    );
    expect(mockApiService.getPlatformAdminRevokedUsers).not.toHaveBeenCalled();
  });
});
