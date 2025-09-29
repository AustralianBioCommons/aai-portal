import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServicesComponent } from './services.component';
import {
  ApiService,
  PlatformUserResponse,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideMockAuth0Service } from '../../../shared/utils/testingUtils';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { PLATFORM_NAMES } from '../../../core/constants/constants';

describe('ServicesComponent', () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserApprovedPlatforms',
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(true),
    });

    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    mockApiService.getUserApprovedPlatforms.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load approved platforms successfully', () => {
    const mockPlatforms: PlatformUserResponse[] = [
      { platform_id: 'bpa_data_portal', approval_status: 'approved' },
    ];
    mockApiService.getUserApprovedPlatforms.and.returnValue(of(mockPlatforms));

    fixture.detectChanges();

    expect(component.approvedPlatforms).toEqual(mockPlatforms);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading platforms fails', () => {
    mockApiService.getUserApprovedPlatforms.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load approved platforms.');
  });

  it('should display no platforms message when empty', () => {
    mockApiService.getUserApprovedPlatforms.and.returnValue(of([]));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('You have no joined services');
  });

  it('should display platforms when available', () => {
    const mockPlatforms: PlatformUserResponse[] = [
      { platform_id: 'bpa_data_portal', approval_status: 'approved' },
    ];
    mockApiService.getUserApprovedPlatforms.and.returnValue(of(mockPlatforms));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(PLATFORM_NAMES.bpa_data_portal);
  });
});
