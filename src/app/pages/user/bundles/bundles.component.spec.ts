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
});
