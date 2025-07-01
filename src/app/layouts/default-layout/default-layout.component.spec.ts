import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, UrlTree } from '@angular/router';
import { of, EMPTY } from 'rxjs';
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
    isLoading = false,
    url = '/',
  ) {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isLoading: signal(isLoading),
      isAuthenticated: signal(isAuthenticated),
      user: signal({ name: 'Test User', picture: 'test.jpg' }),
      isAdmin: signal(isAdmin),
    });

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

    const apiSpy = jasmine.createSpyObj('ApiService', ['getAllPending']);

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
    };
  }

  beforeEach(async () => {
    createTestBed();

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getAllPending.and.returnValue(
      of({ pending_services: [], pending_resources: [] }),
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /all-users for authenticated admin users on root path', async () => {
    createTestBed(true, true, false, '/');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getAllPending.and.returnValue(
      of({ pending_services: [], pending_resources: [] }),
    );

    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/all-users']);
  });

  it('should navigate to /services for authenticated non-admin users on root path', async () => {
    createTestBed(true, false, false, '/');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getAllPending.and.returnValue(
      of({ pending_services: [], pending_resources: [] }),
    );

    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/services']);
  });

  it('should not navigate for unauthenticated users on root path', async () => {
    createTestBed(false, false, false, '/');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getAllPending.and.returnValue(
      of({ pending_services: [], pending_resources: [] }),
    );

    fixture.detectChanges();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not trigger navigation logic when not on root path', async () => {
    createTestBed(true, false, false, '/other-path');
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockApiService.getAllPending.and.returnValue(
      of({ pending_services: [], pending_resources: [] }),
    );

    fixture.detectChanges();

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
