import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BiocommonsAuth0User } from './auth.service';
import { PlatformId } from '../constants/constants';

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

export interface BiocommonsUserResponse {
  id: string;
  email: string;
  email_verified: boolean;
  username: string;
  created_at: string;
}

export interface PlatformMembership {
  id: string;
  platform_id: PlatformId;
  user_id: string;
  approval_status: string;
  updated_by: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  group_name: string;
  approval_status: string;
  updated_by: string;
}

export interface BiocommonsUserDetails extends BiocommonsAuth0User {
  platform_memberships: PlatformMembership[];
  group_memberships: GroupMembership[];
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

  getUsers(
    page = 1,
    pageSize = 20,
    filterBy?: string,
    search?: string,
  ): Observable<BiocommonsUserResponse[]> {
    let params = `?page=${page}&page_size=${pageSize}`;
    if (filterBy) {
      params += `&filter_by=${filterBy}`;
    }
    if (search && search.trim().length > 0) {
      params += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<BiocommonsUserResponse[]>(
      `${environment.auth0.backend}/admin/users${params}`,
    );
  }

  getUserDetails(userId: string): Observable<BiocommonsUserDetails> {
    return this.http.get<BiocommonsUserDetails>(
      `${environment.auth0.backend}/admin/users/${userId}/details`,
    );
  }

  getAdminUnverifiedUsers(
    page = 1,
    pageSize = 20,
    filterBy?: string,
    search?: string,
  ): Observable<BiocommonsUserResponse[]> {
    let params = `?page=${page}&page_size=${pageSize}`;
    if (filterBy) {
      params += `&filter_by=${filterBy}`;
    }
    if (search && search.trim().length > 0) {
      params += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<BiocommonsUserResponse[]>(
      `${environment.auth0.backend}/admin/users/unverified${params}`,
    );
  }

  getAdminPendingUsers(
    page = 1,
    pageSize = 20,
    filterBy?: string,
    search?: string,
  ): Observable<BiocommonsUserResponse[]> {
    let params = `?page=${page}&page_size=${pageSize}`;
    if (filterBy) {
      params += `&filter_by=${filterBy}`;
    }
    if (search && search.trim().length > 0) {
      params += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<BiocommonsUserResponse[]>(
      `${environment.auth0.backend}/admin/users/pending${params}`,
    );
  }

  getAdminRevokedUsers(
    page = 1,
    pageSize = 20,
    filterBy?: string,
    search?: string,
  ): Observable<BiocommonsUserResponse[]> {
    let params = `?page=${page}&page_size=${pageSize}`;
    if (filterBy) {
      params += `&filter_by=${filterBy}`;
    }
    if (search && search.trim().length > 0) {
      params += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<BiocommonsUserResponse[]>(
      `${environment.auth0.backend}/admin/users/revoked${params}`,
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
