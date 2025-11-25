import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { signal } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import {
  ApiService,
  BiocommonsUserResponse,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserAllPending',
      'getPlatformAdminPendingUsers',
      'getPlatformAdminRevokedUsers',
      'getGroupAdminPendingUsers',
      'getGroupAdminRevokedUsers',
      'getAdminUnverifiedUsers',
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: signal(true),
      user: signal({ name: 'Test User', picture: 'test.jpg' }),
      isGeneralAdmin: signal(false),
      isLoading: signal(false),
      adminPlatforms: signal([]),
      adminGroups: signal([]),
      adminType: signal(null),
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
    mockApiService.getPlatformAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getPlatformAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getGroupAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getGroupAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should calculate user counts for admin users', async () => {
    const adminAuthSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: signal(true),
      user: signal({ name: 'Admin User', picture: 'admin.jpg' }),
      isGeneralAdmin: signal(true),
      isLoading: signal(false),
      adminPlatforms: signal([{ id: 'galaxy', name: 'Galaxy' }]),
      adminGroups: signal([]),
      adminType: signal('platform'),
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

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: adminAuthSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    }).compileComponents();

    const adminFixture = TestBed.createComponent(NavbarComponent);
    const adminComponent = adminFixture.componentInstance;

    const mockPendingUsers: Partial<BiocommonsUserResponse>[] = [
      { id: '1', email: 'pending1@test.com' },
      { id: '2', email: 'pending2@test.com' },
    ];
    const mockRevokedUsers: Partial<BiocommonsUserResponse>[] = [
      { id: '3', email: 'revoked1@test.com' },
      { id: '4', email: 'revoked2@test.com' },
      { id: '5', email: 'revoked3@test.com' },
    ];
    const mockUnverifiedUsers: Partial<BiocommonsUserResponse>[] = [
      { id: '6', email: 'unverified1@test.com' },
    ];

    mockApiService.getPlatformAdminPendingUsers.and.returnValue(
      of(mockPendingUsers as BiocommonsUserResponse[]),
    );
    mockApiService.getPlatformAdminRevokedUsers.and.returnValue(
      of(mockRevokedUsers as BiocommonsUserResponse[]),
    );
    mockApiService.getAdminUnverifiedUsers.and.returnValue(
      of(mockUnverifiedUsers as BiocommonsUserResponse[]),
    );

    adminFixture.detectChanges();

    expect(adminComponent.pendingCount()).toBe(2);
    expect(adminComponent.revokedCount()).toBe(3);
    expect(adminComponent.unverifiedCount()).toBe(1);
  });

  it('should handle API error gracefully and reset all counts for platform admin', async () => {
    const adminAuthSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: signal(true),
      user: signal({ name: 'Platform Admin', picture: 'admin.jpg' }),
      isGeneralAdmin: signal(true),
      isLoading: signal(false),
      adminPlatforms: signal([{ id: 'galaxy', name: 'Galaxy' }]),
      adminGroups: signal([]),
      adminType: signal('platform'),
    });

    const routerSpy = jasmine.createSpyObj(
      'Router',
      ['navigate', 'createUrlTree', 'serializeUrl'],
      {
        url: '/all-users',
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

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: adminAuthSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    }).compileComponents();

    const adminFixture = TestBed.createComponent(NavbarComponent);
    const adminComponent = adminFixture.componentInstance;

    mockApiService.getPlatformAdminPendingUsers.and.returnValue(
      throwError(() => new Error('API Error')),
    );
    mockApiService.getPlatformAdminRevokedUsers.and.returnValue(
      throwError(() => new Error('API Error')),
    );
    mockApiService.getAdminUnverifiedUsers.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    adminFixture.detectChanges();

    expect(adminComponent.pendingCount()).toBe(0);
    expect(adminComponent.revokedCount()).toBe(0);
    expect(adminComponent.unverifiedCount()).toBe(0);
  });

  it('should return admin navigation pages for admin', () => {
    Object.defineProperty(mockAuthService, 'isGeneralAdmin', {
      value: signal(true),
    });
    component.isGeneralAdmin = mockAuthService.isGeneralAdmin;

    const pages = component.navigationPages;
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

  it('should refresh counts when data refresh is triggered', () => {
    const adminAuthSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: signal(true),
      user: signal({ name: 'Admin User', picture: 'admin.jpg' }),
      isGeneralAdmin: signal(true),
      isLoading: signal(false),
      adminPlatforms: signal([{ id: 'galaxy', name: 'Galaxy' }]),
      adminGroups: signal([]),
      adminType: signal('platform'),
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

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: adminAuthSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    });

    const adminFixture = TestBed.createComponent(NavbarComponent);
    const dataRefreshService = TestBed.inject(DataRefreshService);

    mockApiService.getPlatformAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getPlatformAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));

    adminFixture.detectChanges();

    mockApiService.getPlatformAdminPendingUsers.calls.reset();
    mockApiService.getPlatformAdminRevokedUsers.calls.reset();
    mockApiService.getAdminUnverifiedUsers.calls.reset();

    dataRefreshService.triggerRefresh();

    expect(mockApiService.getPlatformAdminPendingUsers).toHaveBeenCalled();
    expect(mockApiService.getPlatformAdminRevokedUsers).toHaveBeenCalled();
    expect(mockApiService.getAdminUnverifiedUsers).toHaveBeenCalled();
  });
});
