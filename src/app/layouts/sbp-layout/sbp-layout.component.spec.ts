import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SbpLayoutComponent } from './sbp-layout.component';

describe('SbpLayoutComponent', () => {
  let component: SbpLayoutComponent;
  let fixture: ComponentFixture<SbpLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SbpLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SbpLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
