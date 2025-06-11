import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideMockAuth0Service } from '../../../utils/testingUtils';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('NavbarComponent when logged in', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getAllPending']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(true),
      user: signal({ name: 'Test User', picture: 'test.jpg' }),
    });

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockAuthService = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    mockApiService.getAllPending.and.returnValue(
      of({ pending_services: [], pending_resources: [] }),
    );
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Should display Dashboard nav', () => {
    mockApiService.getAllPending.and.returnValue(
      of({ pending_services: [], pending_resources: [] }),
    );
    fixture.detectChanges();

    const navDe = fixture.debugElement;
    const header = navDe.query(By.css('.text-2xl'));
    expect(header.nativeElement.textContent).toContain('Dashboard');
  });

  it('should display pending count badge when there are pending items', () => {
    const mockPending = {
      pending_services: [
        {
          id: '1',
          name: 'Service',
          status: 'pending',
          last_updated: '',
          updated_by: '',
          resources: [],
        },
      ],
      pending_resources: [{ id: '2', name: 'Resource', status: 'pending' }],
    };
    mockApiService.getAllPending.and.returnValue(of(mockPending));

    fixture.detectChanges();

    expect(component.pendingCount()).toBe(2);
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.bg-red-500');
    expect(badge?.textContent?.trim()).toBe('2');
  });

  it('should handle error when fetching pending count', () => {
    mockApiService.getAllPending.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture.detectChanges();

    expect(component.pendingCount()).toBe(0);
  });
});
