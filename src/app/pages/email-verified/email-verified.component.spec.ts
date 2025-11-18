import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailVerifiedComponent } from './email-verified.component';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';

describe('EmailVerifiedComponent', () => {
  let fixture: ComponentFixture<EmailVerifiedComponent>;
  let component: EmailVerifiedComponent;

  const createComponent = async (
    queryParams: Record<string, string | null>,
    detectChanges = true,
  ) => {
    const activatedRouteStub = {
      queryParamMap: of({
        get: (key: string) => queryParams[key] ?? null,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [EmailVerifiedComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        Title,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerifiedComponent);
    component = fixture.componentInstance;
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  it('should mark email as verified if success=true', async () => {
    await createComponent({
      success: 'true',
      message: '',
    });

    expect(component.emailVerified()).toBeTrue();
  });

  it('should set error message if present in query params', async () => {
    await createComponent({
      success: 'false',
      message: 'Verification failed',
    });

    expect(component.errorMessage()).toBe('Verification failed');
    expect(component.emailVerified()).toBeFalse();
  });

  it('should display success message and button on email verification success', async () => {
    await createComponent({ success: 'true', message: null });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Email Verified',
    );
    expect(compiled.querySelector('p')?.textContent).toContain(
      'Your email has been successfully verified',
    );

    const button = compiled.querySelector('app-button');
    expect(button?.textContent).toContain('Continue');
  });

  it('should render error message and error detail if verification failed', async () => {
    await createComponent({
      success: 'false',
      message: 'Verification token expired',
    });

    const compiled = fixture.nativeElement as HTMLElement;

    const heading = compiled.querySelector('h1');
    const errorDiv = compiled.querySelector('.text-gray-500');

    expect(heading?.textContent).toContain('Email verification error');
    expect(errorDiv?.textContent).toContain('Your email could not be verified');
    expect(errorDiv?.textContent).toContain('Verification token expired');
  });

  it('should have routerLink attribute on continue button', async () => {
    await createComponent({ success: 'true', message: null });

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('app-button');
    const routerLink =
      button?.getAttribute('routerlink') ||
      button?.getAttribute('ng-reflect-router-link');
    expect(routerLink).toBe('/profile');
  });
});
