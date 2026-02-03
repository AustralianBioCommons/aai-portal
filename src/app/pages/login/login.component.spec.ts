import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  template: '<div>Mock Register Component</div>',
})
class MockRegisterComponent {}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login', 'logout']);
    authSpy.authError = signal(null);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([{ path: 'register', component: MockRegisterComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.login when login button is clicked', () => {
    const loginButton = fixture.debugElement.query(By.css('button'));
    loginButton.nativeElement.click();

    expect(authService.login).toHaveBeenCalled();
  });

  it('should display the correct heading', () => {
    const heading = fixture.debugElement.query(By.css('h1'));
    expect(heading.nativeElement.textContent.trim()).toBe(
      'BioCommons Access User Portal',
    );
  });

  it('should auto-login when returning from auth error logout', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('true');
    spyOn(sessionStorage, 'removeItem');

    component.ngOnInit();

    expect(component.isAutoLoggingIn()).toBe(true);
    expect(sessionStorage.removeItem).toHaveBeenCalledWith('auth_error_logout');
    expect(authService.login).toHaveBeenCalled();
  });

  it('should not auto-login when no auth error logout flag', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);

    component.ngOnInit();

    expect(component.isAutoLoggingIn()).toBe(false);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should handle login with auth error by setting flag and logging out', () => {
    authService.authError.set({
      error: 'test_error',
      error_description: 'Test error',
    });
    spyOn(sessionStorage, 'setItem');

    component.handleLogin();

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'auth_error_logout',
      'true',
    );
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should handle login without auth error by calling login directly', () => {
    authService.authError.set(null);

    component.handleLogin();

    expect(authService.login).toHaveBeenCalled();
  });

  it('should display auth error alert when auth error exists', () => {
    authService.authError.set({
      error: 'test_error',
      error_description: 'Test error message',
    });
    fixture.detectChanges();

    const alert = fixture.debugElement.query(By.css('app-alert'));
    expect(alert).toBeTruthy();
    expect(alert.nativeElement.getAttribute('ng-reflect-message')).toBe(
      'Test error message',
    );
  });

  it('should display loading spinner when auto-logging in', () => {
    component.isAutoLoggingIn.set(true);
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('app-loading-spinner'));
    const loginContent = fixture.debugElement.query(By.css('h1'));

    expect(spinner).toBeTruthy();
    expect(loginContent).toBeFalsy();
  });
});
