import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalaxyLayoutComponent } from './galaxy-layout.component';

describe('GalaxyLayoutComponent', () => {
  let component: GalaxyLayoutComponent;
  let fixture: ComponentFixture<GalaxyLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalaxyLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalaxyLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
