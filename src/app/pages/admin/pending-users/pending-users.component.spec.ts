import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { PendingUsersComponent } from './pending-users.component';
import {
  AdminGetUsersApiParams,
  ApiService,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '../components/user-list/user-list.component';

describe('PendingUsersComponent', () => {
  let component: PendingUsersComponent;
  let fixture: ComponentFixture<PendingUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

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

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
      adminGroups: signal([]),
      adminType: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [PendingUsersComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingUsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the correct title', () => {
    expect(component.title).toBe('Pending Requests');
  });

  it('should load users with the correct params', () => {
    fixture.detectChanges();
    const expectedParams = {
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: '',
      approvalStatus: 'pending',
    } as AdminGetUsersApiParams;

    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith(
      expectedParams,
    );
  });
});
