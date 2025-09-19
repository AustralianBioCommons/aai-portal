import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
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
});
