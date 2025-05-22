import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailVerifiedComponent } from './email-verified.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('EmailVerifiedComponent', () => {
  let component: EmailVerifiedComponent;
  let fixture: ComponentFixture<EmailVerifiedComponent>;

  const createComponentWithParams = (queryParams: Record<string, string | null>) => {
    TestBed.configureTestingModule({
      imports: [EmailVerifiedComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of({
              get: (key: string) => queryParams[key] ?? null
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmailVerifiedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  // 🔍 Successful verification test
  it('should display success message for verified email with known app', () => {
    createComponentWithParams({
      success: 'true',
      application_name: 'Galaxy Test Portal'
    });

    expect(component.emailVerified).toBeTrue();
    expect(component.applicationName).toBe('Galaxy Test Portal');
    expect(component.appId).toBe('galaxy');
    expect(component.appUrl).toBe('https://galaxy.test.biocommons.org.au');
    expect(component.message).toContain('Your email has been successfully verified for Galaxy Test Portal');
    expect(component.errorMessage).toBe('');
  });

  // ❌ Unsuccessful verification test
  it('should handle verification failure and show error message', () => {
    createComponentWithParams({
      success: 'false',
      application_name: 'BPA Demo',
      message: 'Invalid verification token'
    });

    expect(component.emailVerified).toBeFalse();
    expect(component.appId).toBe('bpa');
    expect(component.appUrl).toBe('https://aaidemo.bioplatforms.com');
    expect(component.message).toBe('');
    expect(component.errorMessage).toBe('Invalid verification token');
  });

  // 🧪 Fallback behavior when no application_name is provided
  it('should handle verified email with no application name', () => {
    createComponentWithParams({
      success: 'true'
    });

    expect(component.emailVerified).toBeTrue();
    expect(component.applicationName).toBeNull();
    expect(component.appId).toBeNull();
    expect(component.appUrl).toBeNull();
    expect(component.message).toBe('Your email has been successfully verified. You can now log in.');
  });

  // ❓ Edge case: unknown application name
  it('should not match unknown application name to an appId', () => {
    createComponentWithParams({
      success: 'true',
      application_name: 'UnknownApp'
    });

    expect(component.appId).toBeNull();
    expect(component.appUrl).toBeNull();
    expect(component.message).toContain('Your email has been successfully verified for UnknownApp');
  });

  // ✅ DOM: Successful verification test
  it('should render success message and app link for known app', () => {
    createComponentWithParams({
      success: 'true',
      application_name: 'Galaxy'
    });

    const compiled = fixture.nativeElement as HTMLElement;

    const heading = compiled.querySelector('h1');
    const paragraph = compiled.querySelector('p');
    const link = compiled.querySelector('a');

    expect(heading?.textContent).toContain('Email Verified');
    expect(paragraph?.textContent).toContain('Your email has been successfully verified for Galaxy');
    expect(link?.textContent).toContain('Go to Galaxy');
    expect(link?.getAttribute('href')).toBe('https://galaxy.test.biocommons.org.au');
  });

  // ❌ DOM: Unsuccessful verification
  it('should render error message and error detail if verification failed', () => {
    createComponentWithParams({
      success: 'false',
      application_name: 'bpa',
      message: 'Verification token expired'
    });

    const compiled = fixture.nativeElement as HTMLElement;

    const heading = compiled.querySelector('h1');
    const paragraph = compiled.querySelector('p');

    expect(heading?.textContent).toContain('Email verification error');
    expect(paragraph?.textContent).toContain('Your email could not be verified');
    expect(paragraph?.textContent).toContain('Verification token expired');
  });

  // ❓ DOM: Unknown application name should not render app link
  it('should show message but not link for unknown app', () => {
    createComponentWithParams({
      success: 'true',
      application_name: 'RandomApp'
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');

    expect(compiled.querySelector('p')?.textContent).toContain('RandomApp');
    expect(link).toBeNull();
  });
});
