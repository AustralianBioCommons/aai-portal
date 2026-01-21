import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { FirstMigrationComponent } from './first-migration.component';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

describe('FirstMigrationComponent', () => {
  let component: FirstMigrationComponent;
  let fixture: ComponentFixture<FirstMigrationComponent>;

  beforeEach(async () => {
    const mockAuthService = {
      user: jasmine.createSpy('user'),
    };

    const mockApiService = {
      sendMigrationResetPassword: jasmine.createSpy(
        'sendMigrationResetPassword',
      ),
    };

    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
        },
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
