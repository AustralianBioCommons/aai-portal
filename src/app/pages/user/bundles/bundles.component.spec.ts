import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundlesComponent } from './bundles.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import {
  ApiService,
  UserGroupStatus,
} from '../../../core/services/api.service';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ButtonComponent } from '../../../shared/components/button/button.component';

describe('BundlesComponent', () => {
  let component: BundlesComponent;
  let fixture: ComponentFixture<BundlesComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let router: Router;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getUserGroups',
      'requestGroupAccess',
    ]);

    await TestBed.configureTestingModule({
      imports: [BundlesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BundlesComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
    apiService.getUserGroups.and.returnValue(of([]));
  });

  it('should create', () => {
    apiService.getUserGroups.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('Groups that are already approved are disabled in the selection', () => {
    const mockGroups: UserGroupStatus[] = [
      {
        group_id: 'biocommons/group/tsi',
        group_name: 'Threatened Species Initiative',
        approval_status: 'approved',
      },
    ];
    apiService.getUserGroups.and.returnValue(of(mockGroups));

    fixture.detectChanges();

    const tsiBundle = component.bundles().find((b) => b.id === 'tsi');
    expect(tsiBundle?.disabled).toBeTrue();
  });

  it('Selected bundle is submitted via the apiService', () => {
    apiService.getUserGroups.and.returnValue(of([]));
    fixture.detectChanges();

    const bundleId = 'tsi';
    component.bundleForm.patchValue({ bundle: bundleId });

    apiService.requestGroupAccess.and.returnValue(of({ message: 'Success' }));
    const routerSpy = spyOn(router, 'navigate');

    component.submit();

    expect(apiService.requestGroupAccess).toHaveBeenCalledWith(
      `biocommons/group/${bundleId}`,
    );
    expect(routerSpy).toHaveBeenCalledWith(['/profile']);
  });

  it('should disable submit button when no bundle is selected', () => {
    apiService.getUserGroups.and.returnValue(of([]));
    fixture.detectChanges();

    // Initially no bundle is selected
    expect(component.selected()).toBeUndefined();

    const buttonDebugEl = fixture.debugElement.query(
      By.directive(ButtonComponent),
    );
    expect(buttonDebugEl).withContext('app-button not found').toBeTruthy();

    const buttonCmp = buttonDebugEl.componentInstance as ButtonComponent;
    expect(buttonCmp.disabled()).toBeTrue();
  });

  it('should enable submit button when bundle is selected and disable when deselected', () => {
    fixture.detectChanges();
    const buttonDebugEl = fixture.debugElement.query(
      By.directive(ButtonComponent),
    );
    expect(buttonDebugEl).withContext('app-button not found').toBeTruthy();

    const buttonCmp = buttonDebugEl.componentInstance as ButtonComponent;

    // Select a bundle
    component.bundleForm.patchValue({ bundle: 'tsi' });
    fixture.detectChanges();

    expect(component.selected()).toBeDefined();
    expect(component.selected()?.id).toBe('tsi');
    expect(buttonCmp.disabled()).toBe(false);

    // Deselect the bundle
    component.bundleForm.patchValue({ bundle: '' });
    fixture.detectChanges();

    expect(component.selected()).toBeUndefined();
    expect(buttonCmp.disabled()).toBe(true);
  });
});
