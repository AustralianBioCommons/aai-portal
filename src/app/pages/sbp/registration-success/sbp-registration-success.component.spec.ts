import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SbpRegistrationSuccessComponent } from './sbp-registration-success.component';
import { Router } from '@angular/router';

describe('SbpRegistrationSuccessComponent', () => {
  let component: SbpRegistrationSuccessComponent;
  let fixture: ComponentFixture<SbpRegistrationSuccessComponent>;
  const routerStub = {
    getCurrentNavigation: () => ({
      extras: { state: { email: 'sbp.user@example.com' } },
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SbpRegistrationSuccessComponent],
    })
      .overrideProvider(Router, {
        useValue: routerStub,
      })
      .compileComponents();

    fixture = TestBed.createComponent(SbpRegistrationSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the success message', () => {
    const heading = fixture.debugElement.query(By.css('.text-4xl'));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent.trim()).toBe('Thank you');
  });

  it('should display email verification message with the user email', () => {
    const message = fixture.debugElement.query(By.css('.verification-message'));
    expect(message).toBeTruthy();
    const normalizedText = message.nativeElement.textContent
      .replace(/\s+/g, ' ')
      .trim();
    expect(normalizedText).toContain(
      `We've sent a verification email to sbp.user@example.com. Please open that email and click the link inside to finish setting up your account and log in.`,
    );
  });

  it('should have return link to Structural Biology Platform', () => {
    const returnLink = fixture.debugElement.query(By.css('app-button'));
    expect(returnLink).toBeTruthy();
    expect(returnLink.nativeElement.textContent.trim()).toBe(
      'Return to Structural Biology Platform',
    );
  });
});
