import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { UnverifiedUsersComponent } from './unverified-users.component';
import {
  AdminGetUsersApiParams,
  ApiService,
} from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DEFAULT_PAGE_SIZE } from '../components/user-list/user-list.component';
import { By } from '@angular/platform-browser';

describe('UnverifiedUsersComponent', () => {
  let component: UnverifiedUsersComponent;
  let fixture: ComponentFixture<UnverifiedUsersComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getAdminAllUsers',
      'getAdminUsersPageInfo',
      'getFilterOptions',
    ]);
    mockApiService.getAdminAllUsers.and.returnValue(of([]));
    mockApiService.getAdminUsersPageInfo.and.returnValue(
      of({ pages: 0, total: 0, per_page: 50 }),
    );
    mockApiService.getFilterOptions.and.returnValue(of([]));

    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      adminPlatforms: signal([]),
      adminGroups: signal([]),
      adminType: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [UnverifiedUsersComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnverifiedUsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the correct title', () => {
    expect(component.title).toBe('Unverified Users');
  });

  it('should load users with the correct params', () => {
    fixture.detectChanges();
    const expectedParams = {
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      filterBy: '',
      search: '',
      emailVerified: false,
    } as AdminGetUsersApiParams;

    expect(mockApiService.getAdminAllUsers).toHaveBeenCalledWith(
      expectedParams,
    );
  });

  it('should refresh the page when refresh button is clicked', () => {
    const refreshSpy = spyOn(component, 'refreshPage');
    const refreshButton = fixture.debugElement.query(
      By.css('#refresh-page-button'),
    );
    refreshButton.triggerEventHandler('click', null);
    expect(refreshSpy).toHaveBeenCalled();
  });
});
