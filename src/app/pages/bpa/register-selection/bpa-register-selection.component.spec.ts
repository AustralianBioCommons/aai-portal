import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';

import { BpaRegisterSelectionComponent } from './bpa-register-selection.component';

describe('BpaRegisterSelectionComponent', () => {
  let component: BpaRegisterSelectionComponent;
  let fixture: ComponentFixture<BpaRegisterSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaRegisterSelectionComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: { subscribe: () => {} },
            queryParams: { subscribe: () => {} }
          }
        }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BpaRegisterSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render register title', () => {
    const title = fixture.debugElement.query(By.css('.text-3xl'));
    expect(title.nativeElement.textContent.trim()).toBe('Register');
  });

  it('should display Bioplatforms Australia Account section', () => {
    const sectionTitle = fixture.debugElement.query(By.css('.text-2xl'));
    expect(sectionTitle.nativeElement.textContent.trim()).toBe('Bioplatforms Australia Account');
  });

  it('should display BioCommons Account section with benefits list', () => {
    const listItems = fixture.debugElement.queryAll(By.css('li'));
    expect(listItems.length).toBe(3);
    expect(listItems[0].nativeElement.textContent).toContain('Enable a single sign on (SSO) access');
    expect(listItems[1].nativeElement.textContent).toContain('Seamless data repository integration');
    expect(listItems[2].nativeElement.textContent).toContain('A self-service dashboard application');
  });

  it('should have two continue buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    buttons.forEach(button => {
      expect(button.nativeElement.textContent.trim()).toBe('Continue');
    });
  });

  it('should display header logo with correct attributes', () => {
    const headerLogo = fixture.debugElement.query(By.css('.bg-bpa-primary img'));
    expect(headerLogo.nativeElement.src).toContain('BIO-RGB_Full-NEG_Portal_TRANS2_small.webp');
    expect(headerLogo.nativeElement.alt).toBe('Bioplatforms Australia Data Portal Logo');
  });

  it('should display footer logos with correct attributes', () => {
    const footerLogos = fixture.debugElement.queryAll(By.css('.bg-bpa-secondary img'));
    expect(footerLogos.length).toBe(2);
    
    expect(footerLogos[0].nativeElement.src).toContain('BIO-RGB_Large-NEGTRANS_small.webp');
    expect(footerLogos[0].nativeElement.alt).toBe('Bioplatforms Australia Logo');
    
    expect(footerLogos[1].nativeElement.src).toContain('ncris-footer.webp');
    expect(footerLogos[1].nativeElement.alt).toBe('NCRIS Logo');
  });
});
