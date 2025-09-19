import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { RevokedComponent } from './revoked.component';
import {
  ApiService,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';

describe('RevokedComponent', () => {
  let component: RevokedComponent;
  let fixture: ComponentFixture<RevokedComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockUsers: BiocommonsUserResponse[] = [
    {
      id: '1',
      email: 'user1@example.com',
      username: 'user1',
      email_verified: true,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'user2@example.com',
      email_verified: true,
      username: 'user2',
      created_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getAdminRevokedUsers',
    ]);

    await TestBed.configureTestingModule({
      imports: [RevokedComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RevokedComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    apiService.getAdminRevokedUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load revoked users on init', () => {
    apiService.getAdminRevokedUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(apiService.getAdminRevokedUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false);
  });

  it('should handle loading state', () => {
    apiService.getAdminRevokedUsers.and.returnValue(of(mockUsers));

    expect(component.loading).toBe(true);

    component.ngOnInit();

    expect(apiService.getAdminRevokedUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false); // Set to false after successful response
  });

  it('should handle error when loading users', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    apiService.getAdminRevokedUsers.and.returnValue(
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
