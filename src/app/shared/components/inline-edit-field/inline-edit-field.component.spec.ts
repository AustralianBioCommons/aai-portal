import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InlineEditFieldComponent } from './inline-edit-field.component';

describe('InlineEditFieldComponent', () => {
  let component: InlineEditFieldComponent;
  let fixture: ComponentFixture<InlineEditFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InlineEditFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InlineEditFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
