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

  it('should render register title', () => {
    const title = fixture.debugElement.query(By.css('.text-3xl'));
    expect(title.nativeElement.textContent.trim()).toBe('Register');
  });

  it('should have two continue buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    buttons.forEach((button) => {
      expect(button.nativeElement.textContent.trim()).toBe('Continue');
    });
  });
});
