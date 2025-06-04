import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PendingComponent } from './pending.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideMockAuth0Service } from '../../../../utils/testingUtils';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('PendingComponent', () => {
  let component: PendingComponent;
  let fixture: ComponentFixture<PendingComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getAllPending']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(true)
    });

    await TestBed.configureTestingModule({
      imports: [PendingComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PendingComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    mockApiService.getAllPending.and.returnValue(of({ pending_services: [], pending_resources: [] }));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load pending items successfully', () => {
    const mockPending = {
      pending_services: [{ id: '1', name: 'Test Service', status: 'pending', last_updated: '', updated_by: '', resources: [] }],
      pending_resources: [{ id: '2', name: 'Test Resource', status: 'pending' }]
    };
    mockApiService.getAllPending.and.returnValue(of(mockPending));
    
    fixture.detectChanges();
    
    expect(component.pendingItems).toEqual(mockPending);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading pending items fails', () => {
    // Initialize pendingItems to avoid undefined error
    component.pendingItems = { pending_services: [], pending_resources: [] };
    mockApiService.getAllPending.and.returnValue(throwError(() => new Error('API Error')));
    
    fixture.detectChanges();
    
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load pending requests');
  });

  it('should display no pending requests message when empty', () => {
    mockApiService.getAllPending.and.returnValue(of({ pending_services: [], pending_resources: [] }));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('You have no pending access requests');
  });

  it('should display pending items when available', () => {
    const mockPending = {
      pending_services: [{ id: '1', name: 'Test Service', status: 'pending', last_updated: '', updated_by: '', resources: [] }],
      pending_resources: [{ id: '2', name: 'Test Resource', status: 'pending' }]
    };
    mockApiService.getAllPending.and.returnValue(of(mockPending));
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Service');
    expect(compiled.textContent).toContain('Test Resource');
  });

  it('should calculate pendingItemsArray correctly', () => {
    const mockPending = {
      pending_services: [{ id: '1', name: 'Test Service', status: 'pending', last_updated: '', updated_by: '', resources: [] }],
      pending_resources: [{ id: '2', name: 'Test Resource', status: 'pending' }]
    };
    mockApiService.getAllPending.and.returnValue(of(mockPending));
    
    fixture.detectChanges();
    
    expect(component.pendingItemsArray.length).toBe(2);
    expect(component.pendingItemsArray[0].name).toBe('Test Service');
    expect(component.pendingItemsArray[1].name).toBe('Test Resource');
  });
});
