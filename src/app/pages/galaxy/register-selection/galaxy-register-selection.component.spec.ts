import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';

import { GalaxyRegisterSelectionComponent } from './galaxy-register-selection.component';

describe('GalaxyRegisterSelectionComponent', () => {
  let component: GalaxyRegisterSelectionComponent;
  let fixture: ComponentFixture<GalaxyRegisterSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalaxyRegisterSelectionComponent],
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

    fixture = TestBed.createComponent(GalaxyRegisterSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render registration title', () => {
    const title = fixture.debugElement.query(By.css('.text-3xl'));
    expect(title.nativeElement.textContent.trim()).toBe('Registration options');
  });

  it('should render section headings', () => {
    const headings = fixture.debugElement.queryAll(By.css('.text-2xl'));
    expect(headings.length).toBe(2);
    expect(headings[0].nativeElement.textContent.trim()).toBe(
      '1. Galaxy Australia',
    );
    expect(headings[1].nativeElement.textContent.trim()).toBe(
      '2. Galaxy Australia Service Bundles',
    );
  });

  it('should display section descriptions', () => {
    const descriptions = fixture.debugElement.queryAll(
      By.css('.mb-6.font-light.text-gray-500'),
    );
    expect(descriptions.length).toBe(2);
    expect(descriptions[0].nativeElement.textContent.trim()).toBe(
      'Get free access to many free web-based bioinformatics tools and workflows.',
    );
    expect(descriptions[1].nativeElement.textContent.trim()).toBe(
      'Request access to service bundles. These give you access to online bioinformatics data analysis services like Galaxy Australia, community-designed resources, and the Bioplatforms Australia Data Portal, all accessible via a single login.',
    );
  });

  it('should have two continue buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    buttons.forEach((button) => {
      expect(button.nativeElement.textContent.trim()).toBe('Continue');
    });
  });
});
