import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { BpaLayoutComponent } from './bpa-layout.component';
import { environment } from '../../../environments/environment';

describe('BpaLayoutComponent', () => {
  let component: BpaLayoutComponent;
  let fixture: ComponentFixture<BpaLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display header logo with correct attributes when not on bundles route', () => {
    const headerLogo = fixture.debugElement.query(
      By.css('img[alt="Bioplatforms Australia Data Portal Logo"]'),
    );
    expect(headerLogo).toBeTruthy();
    expect(headerLogo.nativeElement.src).toContain('bpa-logo-horizontal.webp');
  });

  it('should link the header logo to the configured BPA portal URL', () => {
    const headerLink = fixture.debugElement.query(By.css('nav a'));
    const expectedUrl = environment.portals.bpaPortal.replace(/\/+$/, '');
    expect(headerLink.nativeElement.getAttribute('href')).toBe(expectedUrl);
  });

  it('should display footer logos with correct attributes when not on bundles route', () => {
    const footerLogos = fixture.debugElement.queryAll(By.css('footer img'));
    expect(footerLogos.length).toBe(2);

    expect(footerLogos[0].nativeElement.src).toContain(
      'bpa-logo-vertical.webp',
    );
    expect(footerLogos[0].nativeElement.alt).toBe(
      'Bioplatforms Australia Logo',
    );

    expect(footerLogos[1].nativeElement.src).toContain('ncris-logo.png');
    expect(footerLogos[1].nativeElement.alt).toBe('NCRIS Logo');
  });

  it('should have footer links to Bioplatforms and NCRIS', () => {
    const footerLinks = fixture.debugElement.queryAll(By.css('footer a'));
    expect(footerLinks.length).toBe(2);

    const expectedBpaUrl = environment.portals.bpaPortal.replace(/\/+$/, '');
    expect(footerLinks[0].nativeElement.getAttribute('href')).toBe(
      expectedBpaUrl,
    );

    const ncrisLink = fixture.debugElement.query(
      By.css(
        'a[href="https://www.education.gov.au/national-collaborative-research-infrastructure-strategy-ncris"]',
      ),
    );
    expect(ncrisLink).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });

  it('should hide header and footer on bundles route', () => {
    spyOnProperty(component.router, 'url', 'get').and.returnValue(
      '/bpa/register/bundles',
    );

    fixture.detectChanges();

    const nav = fixture.debugElement.query(By.css('nav'));
    const footer = fixture.debugElement.query(By.css('footer'));
    expect(nav).toBeNull();
    expect(footer).toBeNull();
  });
});
