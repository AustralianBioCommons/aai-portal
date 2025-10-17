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

  it('should render registration title', () => {
    const title = fixture.debugElement.query(By.css('.text-3xl'));
    expect(title.nativeElement.textContent.trim()).toBe(
      'Registration options',
    );
  });

  it('should display data portal access section', () => {
    const sectionTitles = fixture.debugElement.queryAll(By.css('.text-2xl'));
    expect(sectionTitles.length).toBe(2);
    expect(sectionTitles[0].nativeElement.textContent.trim()).toBe(
      '1. Bioplatforms Australia Data Portal',
    );
  });

  it('should display service bundles section', () => {
    const sectionTitles = fixture.debugElement.queryAll(By.css('.text-2xl'));
    expect(sectionTitles.length).toBe(2);
    expect(sectionTitles[1].nativeElement.textContent.trim()).toBe(
      '2. Bioplatforms Australia Data Portal Service Bundles',
    );
  });

  it('should display section descriptions', () => {
    const descriptions = fixture.debugElement.queryAll(
      By.css('.mb-6.font-light.text-gray-500'),
    );
    expect(descriptions.length).toBe(2);
    expect(descriptions[0].nativeElement.textContent.trim()).toBe(
      "Request access to the Bioplatforms Australia Data Portal's public and restricted data.",
    );
    expect(descriptions[1].nativeElement.textContent.trim()).toBe(
      'Request access to service bundles. These give you access to online bioinformatics data analysis services, community-designed resources, and the Bioplatforms Australia Data Portal - all with a single login.',
    );
  });

  it('should have two continue buttons with correct routing', () => {
    const buttons = fixture.debugElement.queryAll(By.css('app-button'));
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

  it('should have correct button styling', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(buttons[0].nativeElement.className).toContain('border');
    expect(buttons[0].nativeElement.className).toContain('bg-white');
    expect(buttons[0].nativeElement.className).toContain('text-blue-900');

    expect(buttons[1].nativeElement.className).toContain('bg-blue-900');
    expect(buttons[1].nativeElement.className).toContain('text-white');
  });
});
