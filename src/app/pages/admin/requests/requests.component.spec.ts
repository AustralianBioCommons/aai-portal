import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { RequestsComponent } from './requests.component';
import { ApiService } from '../../../core/services/api.service';
import { BiocommonsAuth0User } from '../../../core/services/auth.service';

describe('RequestsComponent', () => {
  let component: RequestsComponent;
  let fixture: ComponentFixture<RequestsComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockUsers: BiocommonsAuth0User[] = [
    {
      created_at: '2024-01-01T00:00:00.000Z',
      email: 'user1@test.com',
      email_verified: true,
      identities: [],
      name: 'User 1',
      nickname: 'user1',
      picture: '',
      updated_at: '2024-01-01T00:00:00.000Z',
      user_id: '1',
    } as BiocommonsAuth0User,
    {
      created_at: '2024-01-02T00:00:00.000Z',
      email: 'user2@test.com',
      email_verified: true,
      identities: [],
      name: 'User 2',
      nickname: 'user2',
      picture: '',
      updated_at: '2024-01-02T00:00:00.000Z',
      user_id: '2',
    } as BiocommonsAuth0User,
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getPendingUsers',
    ]);

    await TestBed.configureTestingModule({
      imports: [RequestsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestsComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    apiService.getPendingUsers.and.returnValue(of(mockUsers));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load pending users on init', () => {
    apiService.getPendingUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();

    expect(apiService.getPendingUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false);
  });

  it('should handle loading state', () => {
    apiService.getPendingUsers.and.returnValue(of(mockUsers));

    expect(component.loading).toBe(false); // Initially false

    component.ngOnInit();

    expect(apiService.getPendingUsers).toHaveBeenCalledWith(1, 50);
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false); // Set to false after successful response
  });

  it('should handle error when loading users', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    apiService.getPendingUsers.and.returnValue(
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
