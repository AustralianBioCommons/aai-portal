import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailVerifiedComponent } from './email-verified.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('EmailVerifiedComponent', () => {
  let component: EmailVerifiedComponent;
  let fixture: ComponentFixture<EmailVerifiedComponent>;

  const createComponentWithParams = (
    queryParams: Record<string, string | null>,
  ) => {
    TestBed.configureTestingModule({
      imports: [EmailVerifiedComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of({
              get: (key: string) => queryParams[key] ?? null,
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerifiedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should set emailVerified when success=true', () => {
    createComponentWithParams({
      success: 'true',
      application_name: 'Galaxy Test Portal',
    });

    expect(component.emailVerified()).toBeTrue();
    expect(component.errorMessage()).toBe('');
  });

  it('should handle verification failure and show error message', () => {
    createComponentWithParams({
      success: 'false',
      application_name: 'BPA Demo',
      message: 'Invalid verification token',
    });

    expect(component.emailVerified()).toBeFalse();
    expect(component.errorMessage()).toBe('Invalid verification token');
  });

  it('should handle verified email with no application name', () => {
    createComponentWithParams({
      success: 'true',
    });

    expect(component.emailVerified()).toBeTrue();
  });

  it('should display success message and links on email verification success', () => {
    createComponentWithParams({ success: 'true' });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Email Verified',
    );
    expect(compiled.querySelector('p')?.textContent).toContain(
      'Your email has been successfully verified',
    );

    const links = compiled.querySelectorAll('a');
    expect(links.length).toBe(2);

    const galaxyLink = Array.from(links).find((link) =>
      link.href.includes('galaxy.test.biocommons.org.au'),
    );
    const bpaLink = Array.from(links).find((link) =>
      link.href.includes('aaidemo.bioplatforms.com'),
    );

    expect(galaxyLink?.textContent).toContain('Go to Galaxy Australia');
    expect(bpaLink?.textContent).toContain(
      'Go to Bioplatforms Australia Data Portal',
    );
  });

  it('should render error message and error detail if verification failed', () => {
    createComponentWithParams({
      success: 'false',
      application_name: 'bpa',
      message: 'Verification token expired',
    });

    const compiled = fixture.nativeElement as HTMLElement;

    const heading = compiled.querySelector('h1');
    const errorDiv = compiled.querySelector('.text-gray-500');

    expect(heading?.textContent).toContain('Email verification error');
    expect(errorDiv?.textContent).toContain('Your email could not be verified');
    expect(errorDiv?.textContent).toContain('Verification token expired');
  });
});
