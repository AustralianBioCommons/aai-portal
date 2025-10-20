import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  ActivatedRouteSnapshot,
  convertToParamMap,
} from '@angular/router';
import { Subject } from 'rxjs';
import { BrandingService } from './branding.service';
import { DOCUMENT } from '@angular/common';

describe('BrandingService', () => {
  let routerEvents$: Subject<NavigationEnd>;
  let titleSpy: jasmine.Spy;
  let service: BrandingService;
  let linkElement: HTMLLinkElement;
  let activatedRouteStub: ActivatedRoute;

  beforeEach(() => {
    routerEvents$ = new Subject<NavigationEnd>();
    titleSpy = jasmine.createSpy('setTitle');

    linkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'icon');
    linkElement.setAttribute('href', 'default.ico');
    document.head.appendChild(linkElement);

    activatedRouteStub = {
      snapshot: { data: {} },
      firstChild: null,
    } as unknown as ActivatedRoute;

    TestBed.configureTestingModule({
      providers: [
        BrandingService,
        { provide: Title, useValue: { setTitle: titleSpy } },
        {
          provide: Router,
          useValue: { events: routerEvents$.asObservable() },
        },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: DOCUMENT, useValue: document },
      ],
    });

    service = TestBed.inject(BrandingService);
  });

  afterEach(() => {
    document.head.removeChild(linkElement);
  });

  const createSnapshot = (data: Record<string, unknown>) =>
    ({
      url: [],
      params: {},
      queryParams: {},
      fragment: null,
      data,
      outlet: 'primary',
      component: null,
      routeConfig: null,
      root: {} as ActivatedRouteSnapshot,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [],
      paramMap: convertToParamMap({}),
      queryParamMap: convertToParamMap({}),
      toString: () => '',
      title: undefined,
    }) as unknown as ActivatedRouteSnapshot;

  it('applies branding from deepest route data', () => {
    const childRoute: Partial<ActivatedRoute> = {
      snapshot: createSnapshot({ title: 'Child Title', favicon: 'child.ico' }),
      firstChild: null,
    };

    (
      activatedRouteStub as unknown as { firstChild: ActivatedRoute | null }
    ).firstChild = childRoute as ActivatedRoute;

    service.init();

    routerEvents$.next(new NavigationEnd(1, '/child', '/child'));

    expect(titleSpy).toHaveBeenCalledWith('Child Title');
    expect(linkElement.getAttribute('href')).toBe('child.ico');
  });

  it('restores defaults when route data lacks branding', () => {
    const childRoute: Partial<ActivatedRoute> = {
      snapshot: createSnapshot({
        title: 'Custom Title',
        favicon: 'custom.ico',
      }),
      firstChild: null,
    };

    (
      activatedRouteStub as unknown as { firstChild: ActivatedRoute | null }
    ).firstChild = childRoute as ActivatedRoute;

    service.init();

    routerEvents$.next(new NavigationEnd(1, '/custom', '/custom'));
    expect(titleSpy).toHaveBeenCalledWith('Custom Title');
    expect(linkElement.getAttribute('href')).toBe('custom.ico');

    titleSpy.calls.reset();
    (
      activatedRouteStub as unknown as { firstChild: ActivatedRoute | null }
    ).firstChild = {
      snapshot: createSnapshot({}),
      firstChild: null,
    } as ActivatedRoute;

    routerEvents$.next(new NavigationEnd(2, '/default', '/default'));

    expect(titleSpy).toHaveBeenCalledWith('AAI Portal');
    expect(linkElement.getAttribute('href')).toBe('default.ico');
  });
});
