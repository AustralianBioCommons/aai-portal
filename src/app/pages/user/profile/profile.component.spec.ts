import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile.component';
import {
  ApiService,
  UserProfileData,
} from '../../../core/services/api.service';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockUser: UserProfileData = {
    user_id: 'auth0|1234567890',
    name: 'Example User',
    email: 'user@example.com',
    email_verified: true,
    username: 'user123',
    picture: 'https://example.com/user.jpg',
    platform_memberships: [
      {
        platform_id: 'galaxy',
        platform_name: 'Galaxy Australia',
        approval_status: 'approved',
      },
    ],
    group_memberships: [
      {
        group_id: 'biocommons/group/tsi',
        group_name: 'Threatened Species Initiative',
        group_short_name: 'TSI',
        approval_status: 'pending',
      },
    ],
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getUserProfile']);
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockApiService.getUserProfile.and.returnValue(of(mockUser));
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load user profile data', () => {
    fixture.detectChanges();

    expect(mockApiService.getUserProfile).toHaveBeenCalled();
    expect(component.user()).toEqual(mockUser);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should handle error when loading user details', () => {
    mockApiService.getUserProfile.and.returnValue(
      throwError(() => new Error('API Error')),
    );
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.error()).toBe('Failed to load user profile');
    expect(component.loading()).toBeFalse();
    expect(component.user()).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load user profile:',
      jasmine.any(Error),
    );
  });

  it('should display user information correctly', () => {
    fixture.detectChanges();

    const userName = fixture.debugElement.query(By.css('#user-name'));
    const userEmail = fixture.debugElement.query(By.css('#user-email'));

    expect(userName.nativeElement.textContent).toContain('Example User');
    expect(userEmail.nativeElement.textContent).toContain('user@example.com');
  });

  it('should display platform memberships correctly', () => {
    fixture.detectChanges();

    const allElements = fixture.debugElement.queryAll(By.css('div'));
    const platformSection = allElements.find((el) =>
      el.nativeElement.textContent?.includes('Services'),
    );
    expect(platformSection).toBeTruthy();

    const statusBadges = fixture.debugElement.queryAll(By.css('.bg-green-100'));
    const approvedBadge = statusBadges.find(
      (badge) => badge.nativeElement.textContent.trim() === 'approved',
    );
    expect(approvedBadge).toBeTruthy();
  });

  it('should display group memberships correctly', () => {
    fixture.detectChanges();

    const allElements = fixture.debugElement.queryAll(By.css('div'));
    const groupSection = allElements.find((el) =>
      el.nativeElement.textContent?.includes('Bundles'),
    );
    expect(groupSection).toBeTruthy();

    const pendingBadge = fixture.debugElement.query(By.css('.bg-yellow-100'));
    expect(pendingBadge?.nativeElement.textContent.trim()).toBe('pending');
  });

  it('should display error message when there is an error', () => {
    mockApiService.getUserProfile.and.returnValue(
      throwError(() => new Error('Test error message')),
    );
    component.loading.set(false);
    component.user.set(null);
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.text-red-500'));
    expect(errorElement.nativeElement.textContent.trim()).toBe(
      'Failed to load user profile',
    );
  });

  it('shows a message when a launch URL is unavailable', () => {
    (
      component as unknown as {
        platformLaunchUrls: Record<string, string | undefined>;
      }
    ).platformLaunchUrls['galaxy'] = undefined;

    fixture.detectChanges();

    const fallback = fixture.debugElement.query(
      By.css('.text-sm.font-medium.text-red-500'),
    );
    expect(fallback.nativeElement.textContent.trim()).toBe(
      'Launch link unavailable',
    );
  });
});
