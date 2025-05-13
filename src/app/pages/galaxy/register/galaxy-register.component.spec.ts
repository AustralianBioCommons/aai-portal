import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalaxyRegisterComponent } from './galaxy-register.component';

describe('RegisterComponent', () => {
  let component: GalaxyRegisterComponent;
  let fixture: ComponentFixture<GalaxyRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalaxyRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
