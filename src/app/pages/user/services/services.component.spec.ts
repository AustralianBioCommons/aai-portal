import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServicesComponent } from './services.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideMockAuth0Service } from '../../../../utils/testingUtils';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('ServicesComponent', () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getApprovedServices']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(true)
    });

    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    mockApiService.getApprovedServices.and.returnValue(of({ approved_services: [] }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load approved services successfully', () => {
    const mockServices = [
      { id: '1', name: 'Test Service', status: 'active', last_updated: '', updated_by: '', resources: [] }
    ];
    mockApiService.getApprovedServices.and.returnValue(of({ approved_services: mockServices }));
    
    fixture.detectChanges();
    
    expect(component.approvedServices).toEqual(mockServices);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading services fails', () => {
    mockApiService.getApprovedServices.and.returnValue(throwError(() => new Error('API Error')));
    
    fixture.detectChanges();
    
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load approved services');
  });

  it('should display no services message when empty', () => {
    mockApiService.getApprovedServices.and.returnValue(of({ approved_services: [] }));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('You have no joined services');
  });

  it('should display services when available', () => {
    const mockServices = [
      { id: '1', name: 'Test Service', status: 'active', last_updated: '', updated_by: '', resources: [] }
    ];
    mockApiService.getApprovedServices.and.returnValue(of({ approved_services: mockServices }));
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Service');
  });
});
