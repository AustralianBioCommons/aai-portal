import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
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

  it('should fetch approved services', () => {
    const mockResponse = { 
      approved_services: [
        { id: '1', name: 'Test Service', status: 'active', last_updated: '', updated_by: '', resources: [] }
      ] 
    };

    service.getApprovedServices().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.approved_services.length).toBe(1);
      expect(response.approved_services[0].name).toBe('Test Service');
    });

    const req = httpMock.expectOne(`${environment.auth0.backend}/me/services/approved`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch approved resources', () => {
    const mockResponse = { 
      approved_resources: [
        { id: '1', name: 'Test Resource', status: 'active' }
      ] 
    };

    service.getApprovedResources().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.approved_resources.length).toBe(1);
      expect(response.approved_resources[0].name).toBe('Test Resource');
    });

    const req = httpMock.expectOne(`${environment.auth0.backend}/me/resources/approved`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch all pending items', () => {
    const mockResponse = { 
      pending_services: [
        { id: '1', name: 'Pending Service', status: 'pending', last_updated: '', updated_by: '', resources: [] }
      ], 
      pending_resources: [
        { id: '2', name: 'Pending Resource', status: 'pending' }
      ] 
    };

    service.getAllPending().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.pending_services.length).toBe(1); 
      expect(response.pending_resources.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.auth0.backend}/me/all/pending`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle empty responses', () => {
    const mockResponse = { pending_services: [], pending_resources: [] };

    service.getAllPending().subscribe(response => {
      expect(response.pending_services).toEqual([]);
      expect(response.pending_resources).toEqual([]);
    });

    const req = httpMock.expectOne(`${environment.auth0.backend}/me/all/pending`);
    req.flush(mockResponse);
  });
});