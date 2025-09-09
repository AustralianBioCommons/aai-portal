import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BiocommonsAuth0User } from './auth.service';

export interface Resource {
  name: string;
  status: string;
  id: string;
}

export interface Service {
  name: string;
  id: string;
  status: string;
  last_updated: string;
  updated_by: string;
  resources: Resource[];
}

export interface Pending {
  pending_services: Service[];
  pending_resources: Resource[];
}

export interface ApprovedServicesResponse {
  approved_services: Service[];
}

export interface ApprovedResourcesResponse {
  approved_resources: Resource[];
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface BiocommonsUserResponse {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface BiocommonsUserDetails extends BiocommonsAuth0User {
  platform_memberships: [];
  group_memberships: [];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  getApprovedServices(): Observable<ApprovedServicesResponse> {
    return this.http.get<ApprovedServicesResponse>(
      `${environment.auth0.backend}/me/services/approved`,
    );
  }

  getApprovedResources(): Observable<ApprovedResourcesResponse> {
    return this.http.get<ApprovedResourcesResponse>(
      `${environment.auth0.backend}/me/resources/approved`,
    );
  }

  getAllPendingRequests(): Observable<Pending> {
    return this.http.get<Pending>(
      `${environment.auth0.backend}/me/all/pending`,
    );
  }

  getFilterOptions(): Observable<FilterOption[]> {
    return this.http.get<FilterOption[]>(
      `${environment.auth0.backend}/admin/filters`,
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

  getUnverifiedUsers(
    page = 1,
    pageSize = 20,
  ): Observable<BiocommonsAuth0User[]> {
    const params = `?page=${page}&page_size=${pageSize}`;
    return this.http.get<BiocommonsAuth0User[]>(
      `${environment.auth0.backend}/admin/users/unverified${params}`,
    );
  }

  getPendingUsers(page = 1, pageSize = 20): Observable<BiocommonsAuth0User[]> {
    const params = `?page=${page}&page_size=${pageSize}`;
    return this.http.get<BiocommonsAuth0User[]>(
      `${environment.auth0.backend}/admin/users/pending${params}`,
    );
  }

  getRevokedUsers(page = 1, pageSize = 20): Observable<BiocommonsAuth0User[]> {
    const params = `?page=${page}&page_size=${pageSize}`;
    return this.http.get<BiocommonsAuth0User[]>(
      `${environment.auth0.backend}/admin/users/revoked${params}`,
    );
  }
}
