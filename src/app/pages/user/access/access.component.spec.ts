import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccessComponent } from './access.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideMockAuth0Service } from '../../../../utils/testingUtils';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('AccessComponent', () => {
  let component: AccessComponent;
  let fixture: ComponentFixture<AccessComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getApprovedResources']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(true)
    });

    await TestBed.configureTestingModule({
      imports: [AccessComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccessComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    mockApiService.getApprovedResources.and.returnValue(of({ approved_resources: [] }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load approved resources successfully', () => {
    const mockResources = [
      { id: '1', name: 'Test Resource', status: 'active' }
    ];
    mockApiService.getApprovedResources.and.returnValue(of({ approved_resources: mockResources }));
    
    fixture.detectChanges();
    
    expect(component.approvedResources).toEqual(mockResources);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading resources fails', () => {
    mockApiService.getApprovedResources.and.returnValue(throwError(() => new Error('API Error')));
    
    fixture.detectChanges();
    
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load approved resources');
  });

  it('should display no access message when empty', () => {
    mockApiService.getApprovedResources.and.returnValue(of({ approved_resources: [] }));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('You have no granted access');
  });

  it('should display resources when available', () => {
    const mockResources = [
      { id: '1', name: 'Test Resource', status: 'active' }
    ];
    mockApiService.getApprovedResources.and.returnValue(of({ approved_resources: mockResources }));
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Resource');
  });
});
