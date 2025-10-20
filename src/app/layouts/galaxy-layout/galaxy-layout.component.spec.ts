import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { GalaxyLayoutComponent } from './galaxy-layout.component';

describe('GalaxyLayoutComponent', () => {
  let component: GalaxyLayoutComponent;
  let fixture: ComponentFixture<GalaxyLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalaxyLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GalaxyLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display Galaxy logo with correct attributes when not on bundle-access route', () => {
    const logo = fixture.debugElement.query(By.css('img[alt="Galaxy logo"]'));
    expect(logo).toBeTruthy();
    expect(logo.nativeElement.src).toContain('favicon.svg');
  });

  it('should display Galaxy Australia branding', () => {
    const branding = fixture.debugElement.query(
      By.css('.text-white.font-bold'),
    );
    expect(branding).toBeTruthy();
    expect(branding.nativeElement.textContent.trim()).toBe('Australia');
  });

  it('should have navigation link to Galaxy portal', () => {
    const link = fixture.debugElement.query(
      By.css('a[href="http://dev.gvl.org.au/"]'),
    );
    expect(link).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });
});
