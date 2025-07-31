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
            params: { subscribe: () => ({}) },
            queryParams: { subscribe: () => ({}) },
          },
        },
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

  it('should display Data Portal Access section', () => {
    const sectionTitles = fixture.debugElement.queryAll(By.css('.text-2xl'));
    expect(sectionTitles.length).toBe(2);
    expect(sectionTitles[0].nativeElement.textContent.trim()).toBe(
      'Data Portal Access',
    );
  });

  it('should display Data Portal Access + Bundles section', () => {
    const sectionTitles = fixture.debugElement.queryAll(By.css('.text-2xl'));
    expect(sectionTitles.length).toBe(2);
    expect(sectionTitles[1].nativeElement.textContent.trim()).toBe(
      'Data Portal Access + Bundles',
    );
  });

  it('should display section descriptions', () => {
    const descriptions = fixture.debugElement.queryAll(
      By.css('.mb-6.font-light.text-gray-500'),
    );
    expect(descriptions.length).toBe(2);
    expect(descriptions[0].nativeElement.textContent.trim()).toBe(
      "Access the Data Portal's public and restricted data.",
    );
    expect(descriptions[1].nativeElement.textContent.trim()).toBe(
      "Access the Data Portal's public and restricted data, plus the Australian BioCommons service bundles.",
    );
  });

  it('should have two continue buttons with correct routing', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);

    buttons.forEach((button) => {
      expect(button.nativeElement.textContent.trim()).toBe('Continue');
    });

    expect(buttons[0].attributes['ng-reflect-router-link']).toBe(
      'standard-access',
    );
    expect(buttons[1].attributes['ng-reflect-router-link']).toBe(
      'bundle-access',
    );
  });

  it('should display header logo with correct attributes', () => {
    const headerLogo = fixture.debugElement.query(
      By.css('.bg-bpa-primary img'),
    );
    expect(headerLogo.nativeElement.src).toContain(
      'BIO-RGB_Full-NEG_Portal_TRANS2_small.webp',
    );
    expect(headerLogo.nativeElement.alt).toBe(
      'Bioplatforms Australia Data Portal Logo',
    );
  });

  it('should display footer logos with correct attributes', () => {
    const footerLogos = fixture.debugElement.queryAll(
      By.css('.bg-bpa-secondary img'),
    );
    expect(footerLogos.length).toBe(2);

    expect(footerLogos[0].nativeElement.src).toContain(
      'BIO-RGB_Large-NEGTRANS_small.webp',
    );
    expect(footerLogos[0].nativeElement.alt).toBe(
      'Bioplatforms Australia Logo',
    );

    expect(footerLogos[1].nativeElement.src).toContain('ncris-footer.webp');
    expect(footerLogos[1].nativeElement.alt).toBe('NCRIS Logo');
  });

  it('should have correct button styling', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(buttons[0].nativeElement.className).toContain('border');
    expect(buttons[0].nativeElement.className).toContain('bg-transparent');
    expect(buttons[0].nativeElement.className).toContain('text-blue-900');

    expect(buttons[1].nativeElement.className).toContain('bg-blue-900');
    expect(buttons[1].nativeElement.className).toContain('text-white');
  });
});
