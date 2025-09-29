import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccessComponent } from './access.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideMockAuth0Service } from '../../../shared/utils/testing-utils';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('AccessComponent', () => {
  let component: AccessComponent;
  let fixture: ComponentFixture<AccessComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserApprovedGroups',
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(true),
    });

    await TestBed.configureTestingModule({
      imports: [AccessComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    mockApiService.getUserApprovedGroups.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load approved groups successfully', () => {
    const mockGroups = [
      {
        group_id: 'tsi',
        group_name: 'Threatened Species Initiative',
        approval_status: 'approved',
      },
    ];
    mockApiService.getUserApprovedGroups.and.returnValue(of(mockGroups));

    fixture.detectChanges();

    expect(component.approvedGroups).toEqual(mockGroups);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading resources fails', () => {
    mockApiService.getUserApprovedGroups.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load approved resources');
  });

  it('should display no access message when empty', () => {
    mockApiService.getUserApprovedGroups.and.returnValue(of([]));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('You have no granted access');
  });

  it('should display resources when available', () => {
    const mockGroups = [
      {
        group_id: 'tsi',
        group_name: 'Threatened Species Initiative',
        approval_status: 'approved',
      },
    ];
    mockApiService.getUserApprovedGroups.and.returnValue(of(mockGroups));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Threatened Species Initiative');
  });
});
