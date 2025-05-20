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

  it('should display the header logo with correct src', () => {
    const logo = fixture.debugElement.query(
      By.css('img[alt="Bioplatforms Australia Data Portal Logo"]'),
    );
    expect(logo).toBeTruthy();
    expect(logo.nativeElement.src).toContain(
      'BIO-RGB_Full-NEG_Portal_TRANS2_small.webp',
    );
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

  it('should have a return link to the BPA Data Portal', () => {
    const links = fixture.debugElement.queryAll(
      By.css('a[href="https://aaidemo.bioplatforms.com/"]'),
    );
    const returnLink = links.find((el) =>
      el.nativeElement.textContent.includes('Return to BPA Data Portal'),
    );

    expect(returnLink).toBeTruthy();
    expect(returnLink!.nativeElement.textContent.trim()).toContain(
      'Return to BPA Data Portal',
    );
  });

  it('should show footer logos with correct src and alt', () => {
    const bpaFooterLogo = fixture.debugElement.query(
      By.css('img[alt="Bioplatforms Australia Logo"]'),
    );
    const ncrisFooterLogo = fixture.debugElement.query(
      By.css('img[alt="NCRIS Logo"]'),
    );

    expect(bpaFooterLogo).toBeTruthy();
    expect(bpaFooterLogo.nativeElement.src).toContain(
      'BIO-RGB_Large-NEGTRANS_small.webp',
    );

    expect(ncrisFooterLogo).toBeTruthy();
    expect(ncrisFooterLogo.nativeElement.src).toContain('ncris-footer.webp');
  });

  it('should link to Bioplatforms and NCRIS in the footer', () => {
    const bpaLink = fixture.debugElement.query(
      By.css('a[href="https://www.bioplatforms.com/"]'),
    );
    const ncrisLink = fixture.debugElement.query(
      By.css(
        'a[href="https://www.education.gov.au/national-collaborative-research-infrastructure-strategy-ncris"]',
      ),
    );

    expect(bpaLink).toBeTruthy();
    expect(ncrisLink).toBeTruthy();
  });
});
