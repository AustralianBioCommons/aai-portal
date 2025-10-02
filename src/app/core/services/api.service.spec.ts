import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  AdminPlatformResponse,
  AllPendingResponse,
  ApiService,
  GroupUserResponse,
  PlatformUserResponse,
} from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch approved platforms', () => {
    const mockResponse: PlatformUserResponse[] = [
      { platform_id: 'galaxy', approval_status: 'approved' },
    ];

    service.getUserApprovedPlatforms().subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.length).toBe(1);
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/platforms/approved`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch platforms the user has admin rights to', () => {
    const mockResponse: AdminPlatformResponse[] = [
      { id: 'galaxy', name: 'Galaxy' },
    ];

    service.getAdminPlatforms().subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.length).toBe(1);
    });
    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/platforms/admin-roles`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch approved groups', () => {
    const mockResponse: GroupUserResponse[] = [
      {
        group_name: 'Threatened Species Initiative',
        group_id: 'tsi',
        approval_status: 'approved',
      },
    ];

    service.getUserApprovedGroups().subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.length).toBe(1);
      expect(response[0].group_name).toBe('Threatened Species Initiative');
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/groups/approved`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch all pending items', () => {
    const mockResponse: AllPendingResponse = {
      platforms: [{ platform_id: 'galaxy', approval_status: 'pending' }],
      groups: [
        {
          group_id: 'tsi',
          group_name: 'Threatened Species Initiative',
          approval_status: 'pending',
        },
      ],
    };

    service.getUserAllPending().subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.platforms.length).toBe(1);
      expect(response.groups.length).toBe(1);
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/all/pending`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle empty responses', () => {
    const mockResponse: AllPendingResponse = { platforms: [], groups: [] };

    service.getUserAllPending().subscribe((response) => {
      expect(response.platforms).toEqual([]);
      expect(response.groups).toEqual([]);
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/me/all/pending`,
    );
    req.flush(mockResponse);
  });

  it('should call approve platform endpoint', () => {
    const userId = 'auth0|123';
    const platformId = 'galaxy';

    service.approvePlatformAccess(userId, platformId).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/platforms/${platformId}/approve`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ updated: true });
  });

  it('should call revoke platform endpoint with reason', () => {
    const userId = 'auth0|123';
    const platformId = 'galaxy';
    const reason = 'No longer required';

    service
      .revokePlatformAccess(userId, platformId, reason)
      .subscribe((response) => {
        expect(response).toEqual({ updated: true });
      });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/platforms/${platformId}/revoke`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({ updated: true });
  });

  it('should call approve group endpoint', () => {
    const userId = 'auth0|123';
    const groupId = 'tsi';

    service.approveGroupAccess(userId, groupId).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/approve`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ updated: true });
  });

  it('should call revoke group endpoint with reason', () => {
    const userId = 'auth0|123';
    const groupId = 'tsi';
    const reason = 'Membership expired';

    service.revokeGroupAccess(userId, groupId, reason).subscribe((response) => {
      expect(response).toEqual({ updated: true });
    });

    const req = httpMock.expectOne(
      `${environment.auth0.backend}/admin/users/${userId}/groups/${groupId}/revoke`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush({ updated: true });
  });
});
