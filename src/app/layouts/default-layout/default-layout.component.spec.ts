import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, UrlTree } from '@angular/router';
import { of, EMPTY, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { DefaultLayoutComponent } from './default-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

describe('DefaultLayoutComponent', () => {
  let component: DefaultLayoutComponent;
  let fixture: ComponentFixture<DefaultLayoutComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  function createTestBed(
    isAuthenticated = true,
    isAdmin = false,
    isLoading = true,
    url = '/',
  ) {
    const isLoadingSignal = signal(isLoading);
    const isAdminSubject = new BehaviorSubject(isAdmin);

    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated'], {
      isLoading: isLoadingSignal,
      user: signal({ name: 'Test User', picture: 'test.jpg' }),
      isGeneralAdmin: signal(isAdmin),
      isGeneralAdmin$: isAdminSubject.asObservable(),
      adminPlatforms: signal([]),
      adminGroups: signal([]),
      adminType: signal(isAdmin ? 'biocommons' : null),
    });

    authSpy.isAuthenticated.and.returnValue(isAuthenticated);

    const routerSpy = jasmine.createSpyObj(
      'Router',
      ['navigate', 'createUrlTree', 'serializeUrl'],
      {
        url: url,
        events: EMPTY,
        routerState: { root: {} },
      },
    );

    routerSpy.createUrlTree.and.returnValue({} as UrlTree);
    routerSpy.serializeUrl.and.returnValue('/mocked-url');

    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getUserAllPending',
      'getAdminPendingUsers',
      'getAdminRevokedUsers',
      'getAdminUnverifiedUsers',
      'getAdminUserCounts',
    ]);

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        params: {},
        queryParams: {},
        data: {},
        url: [],
        fragment: null,
      },
      params: of({}),
      queryParams: of({}),
      data: of({}),
      url: of([]),
      fragment: of(null),
      root: {},
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DefaultLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    });

    return {
      authSpy,
      routerSpy,
      apiSpy,
      isLoadingSignal,
      isAdminSubject,
    };
  }

  beforeEach(async () => {
    createTestBed();

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));
    mockApiService.getAdminUserCounts.and.returnValue(
      of({ all: 0, pending: 0, revoked: 0, unverified: 0 }),
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /all-users for authenticated admin users on root path', async () => {
    const testBed = createTestBed(true, true, true, '/');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));
    mockApiService.getAdminUserCounts.and.returnValue(
      of({ all: 0, pending: 0, revoked: 0, unverified: 0 }),
    );

    fixture.detectChanges();

    testBed.isLoadingSignal.set(false);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/all-users']);
  });

  it('should navigate to /profile for authenticated non-admin users on root path', async () => {
    const testBed = createTestBed(true, false, true, '/');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));
    mockApiService.getAdminUserCounts.and.returnValue(
      of({ all: 0, pending: 0, revoked: 0, unverified: 0 }),
    );

    fixture.detectChanges();

    testBed.isLoadingSignal.set(false);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should navigate to /profile for unauthenticated users on root path', async () => {
    const testBed = createTestBed(false, false, true, '/');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));
    mockApiService.getAdminUserCounts.and.returnValue(
      of({ all: 0, pending: 0, revoked: 0, unverified: 0 }),
    );

    fixture.detectChanges();

    testBed.isLoadingSignal.set(false);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should not trigger navigation logic when not on root path', async () => {
    createTestBed(true, false, false, '/other-path');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminPendingUsers.and.returnValue(of([]));
    mockApiService.getAdminRevokedUsers.and.returnValue(of([]));
    mockApiService.getAdminUnverifiedUsers.and.returnValue(of([]));
    mockApiService.getAdminUserCounts.and.returnValue(
      of({ all: 0, pending: 0, revoked: 0, unverified: 0 }),
    );

    fixture.detectChanges();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
