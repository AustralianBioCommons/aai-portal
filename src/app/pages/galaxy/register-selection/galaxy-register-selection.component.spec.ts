import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalaxyRegisterSelectionComponent } from './galaxy-register-selection.component';

describe('GalaxyRegisterSelectionComponent', () => {
  let component: GalaxyRegisterSelectionComponent;
  let fixture: ComponentFixture<GalaxyRegisterSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalaxyRegisterSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
