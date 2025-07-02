import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginButtonComponent } from './login-button.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('LoginButtonComponent', () => {
  let component: LoginButtonComponent;
  let fixture: ComponentFixture<LoginButtonComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginButtonComponent],
      providers: [
        { provide: AuthService, useValue: authSpy }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginButtonComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.login when login is called', () => {
    component.login();
    expect(mockAuthService.login).toHaveBeenCalled();
  });

  it('should call login when button is clicked', () => {
    spyOn(component, 'login');
    const button = fixture.nativeElement.querySelector('button');
    
    button.click();
    
    expect(component.login).toHaveBeenCalled();
  });
});
