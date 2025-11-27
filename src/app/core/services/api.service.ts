import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BiocommonsAuth0User } from './auth.service';
import { PlatformId } from '../constants/constants';

export type Status = 'approved' | 'revoked' | 'pending';

// Platform membership data for user profile: shouldn't include
// revoked platforms
export interface UserProfilePlatformData {
  platform_id: PlatformId;
  platform_name: string;
  approval_status: Omit<Status, 'revoked'>;
}

// Group membership data for user profile: shouldn't include
// revoked groups
export interface UserProfileGroupData {
  group_id: string;
  group_name: string;
  group_short_name: string;
  approval_status: Omit<Status, 'revoked'>;
}

// Data returned from the API for the user's profile -
// only includes required information for the UI,
// omits information on who approves platforms and groups,
// as well as revoked platforms and groups.
export interface UserProfileData {
  user_id: string;
  name: string;
  email: string;
  email_verified: boolean;
  username: string;
  picture: string;
  created_at: string;
  last_login: string | null;
  updated_at: string;
  platform_memberships: UserProfilePlatformData[];
  group_memberships: UserProfileGroupData[];
}

/**
 * Response for which platforms the admin can manage
 */
export interface AdminPlatformResponse {
  id: PlatformId;
  name: string;
}

/**
 * Response for which groups the admin can manage
 */
export interface AdminGroupResponse {
  id: string;
  name: string;
  short_name: string;
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface PlatformMembership {
  id: string;
  platform_id: PlatformId;
  platform_name: string;
  user_id: string;
  approval_status: string;
  updated_by: string;
  revocation_reason?: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  group_name: string;
  group_short_name: string;
  approval_status: string;
  updated_by: string;
  revocation_reason?: string;
  rejection_reason?: string;
}

export interface BiocommonsUserResponse {
  id: string;
  email: string;
  email_verified: boolean;
  username: string;
  created_at: string;
  platform_memberships: PlatformMembership[];
  group_memberships: GroupMembership[];
}

export interface BiocommonsUserDetails extends BiocommonsAuth0User {
  platform_memberships: PlatformMembership[];
  group_memberships: GroupMembership[];
}

export interface AdminGetUsersApiParams {
  page?: number;
  perPage?: number;
  filterBy?: string;
  search?: string;
  emailVerified?: boolean;
  approvalStatus?: Status;
  platform?: string;
  platformApprovalStatus?: Status;
  group?: string;
  groupApprovalStatus?: Status;
}

export interface UsersPageInfoResponse {
  total: number;
  pages: number;
  per_page: number;
}

export interface AdminUserCountsResponse {
  all: number;
  pending: number;
  revoked: number;
  unverified: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  getUserProfile(): Observable<UserProfileData> {
    return this.http.get<UserProfileData>(
      `${environment.auth0.backend}/me/profile`,
    );
  }

  requestEmailChange(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.auth0.backend}/me/profile/email/update`,
      { email },
    );
  }

  continueEmailChange(otp: string): Observable<void> {
    return this.http.post<void>(
      `${environment.auth0.backend}/me/profile/email/continue`,
      { otp },
    );
  }

  getFilterOptions(): Observable<FilterOption[]> {
    return this.http.get<FilterOption[]>(
      `${environment.auth0.backend}/admin/filters`,
    );
  }

  getAdminPlatforms(): Observable<AdminPlatformResponse[]> {
    return this.http.get<AdminPlatformResponse[]>(
      `${environment.auth0.backend}/me/platforms/admin-roles`,
    );
  }

  private getUserUrlParams(
    params: AdminGetUsersApiParams = {},
  ): URLSearchParams {
    const {
      page = 1,
      perPage = 50,
      filterBy,
      search,
      emailVerified,
      approvalStatus,
      platform,
      platformApprovalStatus,
      group,
      groupApprovalStatus,
    } = params;
    const urlParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filterBy) {
      urlParams.append('filter_by', filterBy);
    }
    if (search?.trim()) {
      urlParams.append('search', search.trim());
    }
    if (emailVerified !== undefined) {
      urlParams.append('email_verified', emailVerified.toString());
    }
    if (approvalStatus) {
      urlParams.append('approval_status', approvalStatus);
    }
    if (platform) {
      urlParams.append('platform', platform);
    }
    if (platformApprovalStatus) {
      urlParams.append('platform_approval_status', platformApprovalStatus);
    }
    if (group) {
      urlParams.append('group', group);
    }
    if (groupApprovalStatus) {
      urlParams.append('group_approval_status', groupApprovalStatus);
    }

    return urlParams;
  }

  getAdminAllUsers(
    params: AdminGetUsersApiParams = {},
  ): Observable<BiocommonsUserResponse[]> {
    const urlParams = this.getUserUrlParams(params);

    return this.http.get<BiocommonsUserResponse[]>(
      `${environment.auth0.backend}/admin/users?${urlParams.toString()}`,
    );
  }

  /**
   * Accepts the same params as getAdminAllUsers() but returns the
   * total users and pages matching the query.
   */
  getAdminUsersPageInfo(
    params: AdminGetUsersApiParams = {},
  ): Observable<UsersPageInfoResponse> {
    const urlParams = this.getUserUrlParams(params);
    return this.http.get<UsersPageInfoResponse>(
      `${environment.auth0.backend}/admin/users/pages?${urlParams.toString()}`,
    );
  }

  getAdminUserCounts(): Observable<AdminUserCountsResponse> {
    return this.http.get<AdminUserCountsResponse>(
      `${environment.auth0.backend}/admin/users/counts`,
    );
  }

  getUserDetails(userId: string): Observable<BiocommonsUserDetails> {
    return this.http.get<BiocommonsUserDetails>(
      `${environment.auth0.backend}/admin/users/${userId}/details`,
    );
  }

  approvePlatformAccess(
    userId: string,
    platformId: PlatformId,
  ): Observable<{ updated: boolean }> {
    return this.http.post<{ updated: boolean }>(
      `${environment.auth0.backend}/admin/users/${userId}/platforms/${platformId}/approve`,
      {},
    );
  }

  revokePlatformAccess(
    userId: string,
    platformId: PlatformId,
    reason: string,
  ): Observable<{ updated: boolean }> {
    return this.http.post<{ updated: boolean }>(
      `${environment.auth0.backend}/admin/users/${userId}/platforms/${platformId}/revoke`,
      { reason },
    );
  }

  approveGroupAccess(
    userId: string,
    groupId: string,
  ): Observable<{ updated: boolean }> {
    return this.http.post<{ updated: boolean }>(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/approve`,
      {},
    );
  }

  revokeGroupAccess(
    userId: string,
    groupId: string,
    reason: string,
  ): Observable<{ updated: boolean }> {
    return this.http.post<{ updated: boolean }>(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/revoke`,
      { reason },
    );
  }

  rejectGroupAccess(
    userId: string,
    groupId: string,
    reason: string,
  ): Observable<{ updated: boolean }> {
    return this.http.post<{ updated: boolean }>(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/reject`,
      { reason },
    );
  }

  resendVerificationEmail(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.auth0.backend}/admin/users/${userId}/verification-email/resend`,
      {},
    );
  }

  updateUserUsername(username: string) {
    return this.http.post<BiocommonsUserDetails>(
      `${environment.auth0.backend}/me/profile/username/update`,
      { username: username },
    );
  }

  updateFullName(fullName: string) {
    return this.http.post<BiocommonsUserDetails>(
      `${environment.auth0.backend}/me/profile/full-name/update`,
      { full_name: fullName },
    );
  }

  updatePassword(currentPassword: string, newPassword: string) {
    return this.http.post<boolean>(
      `${environment.auth0.backend}/me/profile/password/update`,
      { current_password: currentPassword, new_password: newPassword },
    );
  }
}
