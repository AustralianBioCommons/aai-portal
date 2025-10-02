import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { signal } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import {
  AllPendingResponse,
  ApiService,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getUserAllPending']);
    const authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: signal(true),
      user: signal({ name: 'Test User', picture: 'test.jpg' }),
      isAdmin: signal(false),
      isLoading: signal(false),
    });
    const routerSpy = jasmine.createSpyObj(
      'Router',
      ['navigate', 'createUrlTree', 'serializeUrl'],
      {
        url: '/services',
        events: EMPTY,
        routerState: { root: {} },
      },
    );

    routerSpy.createUrlTree.and.returnValue({});
    routerSpy.serializeUrl.and.returnValue('/mocked-url');

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({}),
    });

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
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
    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should calculate pending count correctly', () => {
    const mockPending: AllPendingResponse = {
      platforms: [{ platform_id: 'galaxy', approval_status: 'pending' }],
      groups: [
        { group_id: 'tsi', group_name: 'TSI', approval_status: 'pending' },
      ],
    };
    mockApiService.getUserAllPending.and.returnValue(of(mockPending));

    fixture.detectChanges();

    expect(component.pendingCount()).toBe(2);
  });

  it('should handle API error gracefully', () => {
    mockApiService.getUserAllPending.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture.detectChanges();

    expect(component.pendingCount()).toBe(0);
  });

  it('should return user navigation pages for non-admin', () => {
    const pages = component.navigationPages();
    expect(pages).toEqual([
      { label: 'Services', route: '/services' },
      { label: 'Access', route: '/access' },
      { label: 'Pending', route: '/pending' },
    ]);
  });

  it('should return admin navigation pages for admin', () => {
    Object.defineProperty(mockAuthService, 'isAdmin', {
      value: signal(true),
    });
    component.isAdmin = mockAuthService.isAdmin;

    const pages = component.navigationPages();
    expect(pages).toEqual([
      { label: 'All', route: '/all-users' },
      { label: 'Pending', route: '/pending-users' },
      { label: 'Revoked', route: '/revoked-users' },
      { label: 'Unverified', route: '/unverified-users' },
    ]);
  });

  it('should toggle user menu', () => {
    expect(component.userMenuOpen()).toBe(false);

    component.toggleUserMenu();
    expect(component.userMenuOpen()).toBe(true);

    component.toggleUserMenu();
    expect(component.userMenuOpen()).toBe(false);
  });

  it('should check if route is active', () => {
    expect(component.isActive('/services')).toBe(true);
    expect(component.isActive('/other')).toBe(false);
  });

  it('should call authService.logout when logout is clicked', () => {
    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    fixture.detectChanges();

    component.logout();

    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
