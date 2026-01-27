import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FirstMigrationComponent } from './first-migration.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('FirstMigrationComponent', () => {
  let component: FirstMigrationComponent;
  let fixture: ComponentFixture<FirstMigrationComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockQueryParamMap: jasmine.SpyObj<ParamMap>;

  beforeEach(async () => {
    const mockAuthService = {
      user: jasmine.createSpy('user'),
    };

    mockApiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'sendMigrationResetPassword',
    ]);

    mockQueryParamMap = jasmine.createSpyObj<ParamMap>('ParamMap', ['get']);
    mockQueryParamMap.get.and.returnValue(null);
    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: mockQueryParamMap,
      },
    };

    await TestBed.configureTestingModule({
      imports: [FirstMigrationComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FirstMigrationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('calls sendMigrationResetPassword with session_token and client_id query params', () => {
    mockQueryParamMap.get.and.callFake((key: string) => {
      if (key === 'session_token') {
        return 'session-123';
      }
      if (key === 'client_id') {
        return 'client-456';
      }
      return null;
    });
    mockApiService.sendMigrationResetPassword.and.returnValue(of(true));

    fixture.detectChanges();

    expect(mockQueryParamMap.get).toHaveBeenCalledWith('session_token');
    expect(mockQueryParamMap.get).toHaveBeenCalledWith('client_id');
    expect(mockApiService.sendMigrationResetPassword).toHaveBeenCalledWith(
      'session-123',
      'client-456',
    );
  });

  it('calls sendMigrationResetPassword with session_token and fallback client_id', () => {
    mockQueryParamMap.get.and.callFake((key: string) => {
      if (key === 'session_token') {
        return 'session-123';
      }
      return null;
    });
    mockApiService.sendMigrationResetPassword.and.returnValue(of(true));

    fixture.detectChanges();

    expect(mockQueryParamMap.get).toHaveBeenCalledWith('session_token');
    expect(mockQueryParamMap.get).toHaveBeenCalledWith('client_id');
    expect(mockApiService.sendMigrationResetPassword).toHaveBeenCalledWith(
      'session-123',
      environment.auth0.clientId,
    );
  });
});
