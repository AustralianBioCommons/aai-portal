import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BpaRegistrationSuccessComponent } from './bpa-registration-success.component';

describe('BpaRegistrationSuccessComponent', () => {
  let component: BpaRegistrationSuccessComponent;
  let fixture: ComponentFixture<BpaRegistrationSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegistrationSuccessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaRegistrationSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show the thank you message', () => {
    const message = fixture.nativeElement.textContent;
    expect(message).toContain(
      'Thank you for registering with the Bioplatforms Australia Data Portal',
    );
  });

  it('should display the verification instruction', () => {
    const message = fixture.nativeElement.textContent;
    expect(message).toContain(
      'Registration successful. Please check your email and verify your email address.',
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
