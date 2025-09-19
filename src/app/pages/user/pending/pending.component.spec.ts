import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PendingComponent } from './pending.component';
import {
  AllPendingResponse,
  ApiService,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideMockAuth0Service } from '../../../../utils/testingUtils';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { PLATFORM_NAMES } from '../../../core/constants/constants';

describe('PendingComponent', () => {
  let component: PendingComponent;
  let fixture: ComponentFixture<PendingComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getUserAllPending']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(true),
    });

    await TestBed.configureTestingModule({
      imports: [PendingComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should create', () => {
    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.pendingItems).toEqual({
      platforms: [],
      groups: [],
    });
    expect(component.loading()).toBe(true);
    expect(component.error()).toBeNull();
  });

  it('should load pending items successfully', () => {
    const mockPending: AllPendingResponse = {
      platforms: [{ platform_id: 'galaxy', approval_status: 'pending' }],
      groups: [
        {
          group_id: 'tsi',
          group_name: 'Threatened Species Initiative',
          approval_status: 'pending',
        },
      ],
    };
    mockApiService.getUserAllPending.and.returnValue(of(mockPending));

    fixture.detectChanges();

    expect(component.pendingItems).toEqual(mockPending);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading pending items fails', () => {
    const consoleSpy = spyOn(console, 'error');
    mockApiService.getUserAllPending.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Failed to load pending requests');
    expect(component.pendingItems).toEqual({
      platforms: [],
      groups: [],
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to retrieve pending requests',
      jasmine.any(Error),
    );
  });

  it('should not load data when user is not authenticated', () => {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: signal(false),
    });
    const apiSpy = jasmine.createSpyObj('ApiService', ['getUserAllPending']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PendingComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        provideMockAuth0Service({ isAuthenticated: false }),
        provideHttpClient(),
        provideRouter([]),
      ],
    });

    const testFixture = TestBed.createComponent(PendingComponent);
    const testComponent = testFixture.componentInstance;
    const testApiService = TestBed.inject(
      ApiService,
    ) as jasmine.SpyObj<ApiService>;

    testFixture.detectChanges();

    expect(testApiService.getUserAllPending).not.toHaveBeenCalled();
    expect(testComponent.loading()).toBe(true);
  });

  it('should display no pending requests message when empty', () => {
    mockApiService.getUserAllPending.and.returnValue(
      of({ platforms: [], groups: [] }),
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(
      'You have no pending access requests',
    );
  });

  it('should display pending items when available', () => {
    const mockPending: AllPendingResponse = {
      platforms: [{ platform_id: 'galaxy', approval_status: 'pending' }],
      groups: [
        {
          group_id: 'tsi',
          group_name: 'Threatened Species Initiative',
          approval_status: 'pending',
        },
      ],
    };
    mockApiService.getUserAllPending.and.returnValue(of(mockPending));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Galaxy Australia');
    expect(compiled.textContent).toContain('Threatened Species Initiative');
  });

  it('should calculate pendingItemsArray correctly', () => {
    const mockPending: AllPendingResponse = {
      platforms: [{ platform_id: 'galaxy', approval_status: 'pending' }],
      groups: [
        {
          group_id: 'tsi',
          group_name: 'Threatened Species Initiative',
          approval_status: 'pending',
        },
      ],
    };
    mockApiService.getUserAllPending.and.returnValue(of(mockPending));

    fixture.detectChanges();

    expect(component.pendingItemsArray.length).toBe(2);
    expect(component.pendingItemsArray[0].name).toBe(PLATFORM_NAMES.galaxy);
    expect(component.pendingItemsArray[1].name).toBe(
      'Threatened Species Initiative',
    );
  });

  it('should return empty array from pendingItemsArray when pendingItems is null', () => {
    component.pendingItems = null as unknown as AllPendingResponse;
    expect(component.pendingItemsArray).toEqual([]);
  });

  it('should handle missing arrays in pendingItems', () => {
    component.pendingItems = {} as AllPendingResponse;
    expect(component.pendingItemsArray).toEqual([]);
  });

  it('should handle partial data in pendingItems', () => {
    component.pendingItems = {
      platforms: [{ platform_id: 'galaxy', approval_status: 'pending' }],
      groups: undefined as unknown as never[],
    };

    expect(component.pendingItemsArray.length).toBe(1);
    expect(component.pendingItemsArray[0].name).toBe(PLATFORM_NAMES.galaxy);
  });
});
