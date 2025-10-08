import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { BpaLayoutComponent } from './bpa-layout.component';

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

  it('should display header logo with correct attributes when not on bundle-access route', () => {
    const headerLogo = fixture.debugElement.query(
      By.css('img[alt="Bioplatforms Australia Data Portal Logo"]'),
    );
    expect(headerLogo).toBeTruthy();
    expect(headerLogo.nativeElement.src).toContain('bpa-logo-horizontal.webp');
  });

  it('should display footer logos with correct attributes when not on bundle-access route', () => {
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

  it('should render router-outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });
});
