import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequestServiceComponent } from './request-service.component';
import { provideMockAuth0Service } from '../../../../shared/utils/testing-utils';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('RequestServiceComponent', () => {
  let component: RequestServiceComponent;
  let fixture: ComponentFixture<RequestServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestServiceComponent],
      providers: [
        provideMockAuth0Service({ isAuthenticated: true }),
        provideHttpClient(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
