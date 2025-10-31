import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Modal');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit primaryOutput event when onPrimary is called', () => {
    spyOn(component.primaryOutput, 'emit');
    component.onPrimary();
    expect(component.primaryOutput.emit).toHaveBeenCalled();
  });

  it('should emit secondaryOutput event when onSecondary is called', () => {
    spyOn(component.secondaryOutput, 'emit');
    component.onSecondary();
    expect(component.secondaryOutput.emit).toHaveBeenCalled();
  });

  it('should show textarea when type is revoke and textareaControl is provided', () => {
    fixture.componentRef.setInput('type', 'revoke');
    fixture.componentRef.setInput('textareaControl', new FormControl(''));
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('#modal-textarea');
    expect(textarea).toBeTruthy();
  });
});
