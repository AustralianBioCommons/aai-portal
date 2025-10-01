import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalaxyRegisterSuccessComponent } from './galaxy-register-success.component';

describe('RegisterSuccessComponent', () => {
  let component: GalaxyRegisterSuccessComponent;
  let fixture: ComponentFixture<GalaxyRegisterSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalaxyRegisterSuccessComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GalaxyRegisterSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
