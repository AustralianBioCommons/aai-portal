import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BiocommonsAuth0User } from './auth.service';
import { PlatformId } from '../constants/constants';

export type Status = 'approved' | 'revoked' | 'pending';

/**
 * response for which platforms the admin can manage
 */
export interface AdminPlatformResponse {
  id: PlatformId;
  name: string;
}

export interface PlatformUserResponse {
  platform_id: PlatformId;
  approval_status: string;
}

export interface GroupUserResponse {
  group_id: string;
  approval_status: string;
  group_name: string;
}

export interface AllPendingResponse {
  platforms: PlatformUserResponse[];
  groups: GroupUserResponse[];
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
  platform?: string;
  platformApprovalStatus?: Status;
  group?: string;
  groupApprovalStatus?: Status;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  getUserApprovedPlatforms(): Observable<PlatformUserResponse[]> {
    return this.http.get<PlatformUserResponse[]>(
      `${environment.auth0.backend}/me/platforms/approved`,
    );
  }

  getUserApprovedGroups(): Observable<GroupUserResponse[]> {
    return this.http.get<GroupUserResponse[]>(
      `${environment.auth0.backend}/me/groups/approved`,
    );
  }

  getUserAllPending(): Observable<AllPendingResponse> {
    return this.http.get<AllPendingResponse>(
      `${environment.auth0.backend}/me/all/pending`,
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

  getAdminAllUsers(
    params: AdminGetUsersApiParams = {},
  ): Observable<BiocommonsUserResponse[]> {
    const {
      page = 1,
      perPage = 50,
      filterBy,
      search,
      emailVerified,
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

    return this.http.get<BiocommonsUserResponse[]>(
      `${environment.auth0.backend}/admin/users?${urlParams.toString()}`,
    );
  }

  getAdminPendingUsers(
    params: AdminGetUsersApiParams = {},
  ): Observable<BiocommonsUserResponse[]> {
    return this.getAdminAllUsers({
      ...params,
      platformApprovalStatus: 'pending',
    });
  }

  getAdminRevokedUsers(
    params: AdminGetUsersApiParams = {},
  ): Observable<BiocommonsUserResponse[]> {
    return this.getAdminAllUsers({
      ...params,
      platformApprovalStatus: 'revoked',
    });
  }

  getAdminUnverifiedUsers(
    params: AdminGetUsersApiParams = {},
  ): Observable<BiocommonsUserResponse[]> {
    return this.getAdminAllUsers({
      ...params,
      emailVerified: false,
    });
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

  resendVerificationEmail(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.auth0.backend}/admin/users/${userId}/verification-email/resend`,
      {},
    );
  }
}
