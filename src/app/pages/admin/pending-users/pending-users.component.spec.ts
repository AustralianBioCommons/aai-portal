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

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getAdminPendingUsers',
      'getFilterOptions',
    ]);
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getFilterOptions.and.returnValue(of([]));

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
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

  it('should bind getUsers to the correct API method', () => {
    const params = {
      page: 1,
      perPage: 50,
      filterBy: '',
      search: '',
    };

    component.getUsers(params).subscribe();

    expect(mockApiService.getAdminPendingUsers).toHaveBeenCalledWith(params);
  });
});
