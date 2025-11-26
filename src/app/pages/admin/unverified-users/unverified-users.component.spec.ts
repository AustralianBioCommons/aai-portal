import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { UnverifiedUsersComponent } from './unverified-users.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

describe('UnverifiedUsersComponent', () => {
  let component: UnverifiedUsersComponent;
  let fixture: ComponentFixture<UnverifiedUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getAdminUnverifiedUsers',
      'getFilterOptions',
    ]);
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));
    mockApiService.getFilterOptions.and.returnValue(of([]));

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
    });

    await TestBed.configureTestingModule({
      imports: [UnverifiedUsersComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnverifiedUsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the correct title', () => {
    expect(component.title).toBe('Unverified Users');
  });

  it('should bind getUsers to getAdminUnverifiedUsers API method', () => {
    const params = { page: 1, perPage: 50, filterBy: '', search: '' };
    component.getUsers(params).subscribe();

    expect(mockApiService.getAdminUnverifiedUsers).toHaveBeenCalledWith(params);
  });
});
