import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
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
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);

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
    expect(heading.nativeElement.textContent.trim()).toBe('AAI User Portal');
  });
});
