import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { RevokedUsersComponent } from './revoked-users.component';
import {
  AdminGetUsersApiParams,
  ApiService,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '../components/user-list/user-list.component';

describe('RevokedUsersComponent', () => {
  let component: RevokedUsersComponent;
  let fixture: ComponentFixture<RevokedUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let adminPlatformsSignal = signal([]);
  let adminGroupsSignal = signal([]);
  let adminTypeSignal = signal(null as any);

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getAdminAllUsers',
      'getAdminUsersPageInfo',
      'getFilterOptions',
    ]);
    mockApiService.getAdminAllUsers.and.returnValue(of([]));
    mockApiService.getAdminUsersPageInfo.and.returnValue(
      of({ pages: 0, total: 0, per_page: 50 }),
    );
    mockApiService.getFilterOptions.and.returnValue(of([]));

    adminPlatformsSignal = signal([]);
    adminGroupsSignal = signal([]);
    adminTypeSignal = signal(null);

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: adminPlatformsSignal,
      adminGroups: adminGroupsSignal,
      adminType: adminTypeSignal,
    });

    await TestBed.configureTestingModule({
      imports: [RevokedUsersComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RevokedUsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the correct title', () => {
    expect(component.title).toBe('Revoked Users');
  });

  it('should load revoked users for biocommons admins', () => {
    adminTypeSignal.set('biocommons');
    fixture.detectChanges();
    const expectedParams = {
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: '',
      approvalStatus: 'revoked',
    } as AdminGetUsersApiParams;

    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith(
      expectedParams,
    );
  });

  it('should load revoked users scoped to platform for platform admins', () => {
    adminTypeSignal.set('platform');
    adminPlatformsSignal.set([{ id: 'galaxy', name: 'Galaxy Australia' }]);
    fixture.detectChanges();
    const expectedParams = {
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: '',
      platform: 'galaxy',
      platformApprovalStatus: 'revoked',
    } as AdminGetUsersApiParams;

    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith(
      expectedParams,
    );
  });
});
