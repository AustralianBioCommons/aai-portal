import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ListUnverifiedUsersComponent } from './list-unverified-users.component';
import {
  ApiService,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';

describe('ListUnverifiedUsersComponent', () => {
  let component: ListUnverifiedUsersComponent;
  let fixture: ComponentFixture<ListUnverifiedUsersComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockUsers: BiocommonsUserResponse[] = [
    {
      id: '1',
      created_at: '2024-01-01T00:00:00.000Z',
      username: 'unverified1',
      email: 'unverified1@test.com',
      email_verified: false,
    },
    {
      id: '2',
      created_at: '2024-01-01T00:00:00.000Z',
      username: 'unverified2',
      email: 'unverified2@example.com',
      email_verified: false,
    },
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getAdminUnverifiedUsers',
    ]);

    await TestBed.configureTestingModule({
      imports: [ListUnverifiedUsersComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListUnverifiedUsersComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    apiService.getAdminUnverifiedUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load unverified users on init', () => {
    apiService.getAdminUnverifiedUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(apiService.getAdminUnverifiedUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false);
  });

  it('should handle loading state', () => {
    apiService.getAdminUnverifiedUsers.and.returnValue(of(mockUsers));

    expect(component.loading).toBe(false); // Initially false

    component.ngOnInit();

    expect(apiService.getAdminUnverifiedUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false); // Set to false after successful response
  });

  it('should handle error when loading users', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    apiService.getAdminUnverifiedUsers.and.returnValue(
      throwError(() => new Error('Test error')),
    );

    component.ngOnInit();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading users:',
      jasmine.any(Error),
    );
    expect(component.users).toEqual([]);
    expect(component.loading).toBe(false);
  });
});
