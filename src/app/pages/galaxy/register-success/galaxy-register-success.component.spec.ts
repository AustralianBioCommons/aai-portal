import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GalaxyRegisterSuccessComponent } from './galaxy-register-success.component';
import { Router } from '@angular/router';

describe('RegisterSuccessComponent', () => {
  let component: GalaxyRegisterSuccessComponent;
  let fixture: ComponentFixture<GalaxyRegisterSuccessComponent>;
  const routerStub = {
    getCurrentNavigation: () => ({
      extras: { state: { email: 'galaxy.user@example.com' } },
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalaxyRegisterSuccessComponent],
    })
      .overrideProvider(Router, {
        useValue: routerStub,
      })
      .compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display thank you heading and verification message', () => {
    const heading = fixture.debugElement.query(By.css('.text-4xl'));
    expect(heading.nativeElement.textContent.trim()).toBe('Thank you');

    const message = fixture.debugElement.query(By.css('.verification-message'));
    const normalizedText = message.nativeElement.textContent
      .replace(/\s+/g, ' ')
      .trim();
    expect(normalizedText).toContain(
      `We've sent a verification email to galaxy.user@example.com. Please open that email and click the link inside to finish setting up your account and log in.`,
    );
  });
});
