import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { SbpLayoutComponent } from './sbp-layout.component';

describe('SbpLayoutComponent', () => {
  let component: SbpLayoutComponent;
  let fixture: ComponentFixture<SbpLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SbpLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SbpLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the SBP logo with correct attributes', () => {
    const logo = fixture.debugElement.query(
      By.css('img[alt="Structural Biology Platform Logo"]'),
    );
    expect(logo).toBeTruthy();
    expect(logo.nativeElement.src).toContain('/assets/sbp-logo.png');
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

  it('should render router-outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });
});
