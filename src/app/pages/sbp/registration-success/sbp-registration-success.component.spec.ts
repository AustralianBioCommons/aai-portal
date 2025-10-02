import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SbpRegistrationSuccessComponent } from './sbp-registration-success.component';

describe('SbpRegistrationSuccessComponent', () => {
  let component: SbpRegistrationSuccessComponent;
  let fixture: ComponentFixture<SbpRegistrationSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SbpRegistrationSuccessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SbpRegistrationSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the header logo with correct src', () => {
    const logo = fixture.debugElement.query(
      By.css('img[alt="Structural Biology Platform Logo"]'),
    );
    expect(logo).toBeTruthy();
    expect(logo.nativeElement.src).toContain('/assets/sbp-logo.png');
  });

  it('should display the success message', () => {
    const heading = fixture.debugElement.query(By.css('.text-4xl'));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent.trim()).toBe(
      'Thank you for registering with the Structural Biology Platform',
    );
  });

  it('should display email verification message', () => {
    const message = fixture.debugElement.query(By.css('.text-gray-500'));
    expect(message).toBeTruthy();
    expect(message.nativeElement.textContent.trim()).toBe(
      'Please check your email and verify your email address. Your request has been sent to an administrator for approval.',
    );
  });

  it('should have return link to Structural Biology Platform', () => {
    const returnLink = fixture.debugElement.query(By.css('app-button'));
    expect(returnLink).toBeTruthy();
    expect(returnLink.nativeElement.textContent.trim()).toBe(
      'Return to Structural Biology Platform',
    );
  });

  it('should have navigation links in header', () => {
    const aboutLink = fixture.debugElement.query(
      By.css('a[href="https://www.biocommons.org.au/about"]'),
    );
    const faqLink = fixture.debugElement.query(
      By.css('a[href="https://www.biocommons.org.au/"]'),
    );
    const contactLink = fixture.debugElement.query(
      By.css('a[href="https://www.biocommons.org.au/contact-form"]'),
    );

    expect(aboutLink).toBeTruthy();
    expect(aboutLink.nativeElement.textContent.trim()).toBe('About');

    expect(faqLink).toBeTruthy();
    expect(faqLink.nativeElement.textContent.trim()).toBe('FAQ');

    expect(contactLink).toBeTruthy();
    expect(contactLink.nativeElement.textContent.trim()).toBe('Contact us');
  });
});
