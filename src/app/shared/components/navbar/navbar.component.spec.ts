import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { signal } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DataRefreshService } from '../../../core/services/data-refresh.service';
import { By } from '@angular/platform-browser';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getAdminUserCounts']);
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
    mockApiService.getAdminUserCounts.and.returnValue(
      of({
        all: 0,
        pending: 0,
        revoked: 0,
        unverified: 0,
      }),
    );
  });

  it('should create', () => {
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

    mockApiService.getAdminUserCounts.and.returnValue(
      of({
        all: 10,
        pending: 2,
        revoked: 3,
        unverified: 1,
      }),
    );

    adminFixture.detectChanges();

    expect(adminComponent.userCounts().pending).toBe(2);
    expect(adminComponent.userCounts().revoked).toBe(3);
    expect(adminComponent.userCounts().unverified).toBe(1);
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

    mockApiService.getAdminUserCounts.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    adminFixture.detectChanges();

    expect(adminComponent.userCounts().pending).toBe(0);
    expect(adminComponent.userCounts().revoked).toBe(0);
    expect(adminComponent.userCounts().unverified).toBe(0);
  });

  it('should return admin navigation pages for admin', () => {
    Object.defineProperty(mockAuthService, 'isGeneralAdmin', {
      value: signal(true),
    });
    component.isGeneralAdmin = mockAuthService.isGeneralAdmin;

    const pages = component.navigationPages;
    expect(pages).toEqual([
      { label: 'All', route: '/all-users', icon: 'heroUserCircle' },
      { label: 'Pending', route: '/pending-users', icon: 'heroClock' },
      { label: 'Revoked', route: '/revoked-users', icon: 'heroXCircle' },
      { label: 'Unverified', route: '/unverified-users', icon: 'heroEnvelope' },
    ]);
  });

  it('should call authService.logout when logout is clicked', () => {
    fixture.detectChanges();

    component.logout();

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should render a support link for non-admin users', () => {
    fixture.detectChanges();

    const supportLink = fixture.debugElement
      .queryAll(By.css('a'))
      .find(
        (link) =>
          link.nativeElement.textContent.includes('Support') &&
          link.nativeElement.getAttribute('href') ===
            'https://biocommonsaccess.freshdesk.com/support/home',
      );

    expect(supportLink).toBeTruthy();
    expect(supportLink!.nativeElement.getAttribute('target')).toBe('_blank');
  });

  it('should not render a support link for admin users', async () => {
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
    adminFixture.detectChanges();

    const supportLink = adminFixture.debugElement
      .queryAll(By.css('a'))
      .find((link) => link.nativeElement.textContent.includes('Support'));

    expect(supportLink).toBeUndefined();
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

    mockApiService.getAdminUserCounts.and.returnValue(
      of({ all: 0, pending: 0, revoked: 0, unverified: 0 }),
    );
    adminFixture.detectChanges();
    mockApiService.getAdminUserCounts.calls.reset();

    dataRefreshService.triggerRefresh();
    adminFixture.detectChanges();

    expect(mockApiService.getAdminUserCounts).toHaveBeenCalled();
  });
});
