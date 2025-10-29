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

  it('should display the success message', () => {
    const heading = fixture.debugElement.query(By.css('.text-4xl'));
    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent.trim()).toBe(
      'Thank you',
    );
  });

  it('should display email verification message', () => {
    const message = fixture.debugElement.query(By.css('.font-light'));
    expect(message).toBeTruthy();
    expect(message.nativeElement.textContent.trim()).toBe(
      'You will receive an email notification once your access request has been approved.',
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
