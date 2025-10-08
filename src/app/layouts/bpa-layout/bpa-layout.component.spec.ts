import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpaLayoutComponent } from './bpa-layout.component';

describe('BpaLayoutComponent', () => {
  let component: BpaLayoutComponent;
  let fixture: ComponentFixture<BpaLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpaLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BpaLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
