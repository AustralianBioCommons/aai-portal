import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { RevokedComponent } from './revoked.component';
import { ApiService } from '../../../core/services/api.service';
import { BiocommonsAuth0User } from '../../../core/services/auth.service';

describe('RevokedComponent', () => {
  let component: RevokedComponent;
  let fixture: ComponentFixture<RevokedComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockUsers: BiocommonsAuth0User[] = [
    {
      created_at: '2024-01-01T00:00:00.000Z',
      email: 'revoked1@test.com',
      email_verified: true,
      identities: [],
      name: 'Revoked User 1',
      nickname: 'revoked1',
      picture: '',
      updated_at: '2024-01-01T00:00:00.000Z',
      user_id: '1',
    } as BiocommonsAuth0User,
    {
      created_at: '2024-01-02T00:00:00.000Z',
      email: 'revoked2@test.com',
      email_verified: true,
      identities: [],
      name: 'Revoked User 2',
      nickname: 'revoked2',
      picture: '',
      updated_at: '2024-01-02T00:00:00.000Z',
      user_id: '2',
    } as BiocommonsAuth0User,
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getRevokedUsers',
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
    apiService.getRevokedUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load revoked users on init', () => {
    apiService.getRevokedUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(apiService.getRevokedUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false);
  });

  it('should handle loading state', () => {
    apiService.getRevokedUsers.and.returnValue(of(mockUsers));

    expect(component.loading).toBe(false); // Initially false

    component.ngOnInit();

    expect(apiService.getRevokedUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false); // Set to false after successful response
  });

  it('should handle error when loading users', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    apiService.getRevokedUsers.and.returnValue(
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
