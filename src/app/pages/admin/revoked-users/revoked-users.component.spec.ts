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

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getAdminRevokedUsers',
      'getFilterOptions',
    ]);
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getFilterOptions.and.returnValue(of([]));

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
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

  it('should bind getUsers to the correct API method', () => {
    const params = {
      page: 1,
      perPage: 50,
      filterBy: '',
      search: '',
    };

    component.getUsers(params).subscribe();

    expect(mockApiService.getAdminRevokedUsers).toHaveBeenCalledWith(params);
  });
});
