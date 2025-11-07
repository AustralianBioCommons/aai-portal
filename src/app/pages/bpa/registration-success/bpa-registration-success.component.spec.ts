import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BpaRegistrationSuccessComponent } from './bpa-registration-success.component';
import { Router } from '@angular/router';

describe('BpaRegistrationSuccessComponent', () => {
  let component: BpaRegistrationSuccessComponent;
  let fixture: ComponentFixture<BpaRegistrationSuccessComponent>;
  const routerStub = {
    getCurrentNavigation: () => ({
      extras: { state: { email: 'researcher@example.com' } },
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegistrationSuccessComponent],
    })
      .overrideProvider(Router, {
        useValue: routerStub,
      })
      .compileComponents();

    fixture = TestBed.createComponent(BpaRegistrationSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show the thank you heading', () => {
    const heading = fixture.debugElement.query(By.css('.text-4xl'));
    expect(heading.nativeElement.textContent.trim()).toBe('Thank you');
  });

  it('should display the verification instruction with the users email', () => {
    const message = fixture.debugElement.query(By.css('.verification-message'));
    const normalizedText = message.nativeElement.textContent
      .replace(/\s+/g, ' ')
      .trim();
    expect(normalizedText).toContain(
      `Thank you! We've sent a verification email to researcher@example.com. Please open that email and click the link inside to finish setting up your account and log in.`,
    );
  });

  it('should have a return link to the Bioplatforms Australia Data Portal', () => {
    const returnButton = fixture.debugElement.query(By.css('app-button'));

    expect(returnButton).toBeTruthy();
    expect(returnButton.nativeElement.textContent.trim()).toContain(
      'Return to Bioplatforms Australia Data Portal',
    );
  });
});
