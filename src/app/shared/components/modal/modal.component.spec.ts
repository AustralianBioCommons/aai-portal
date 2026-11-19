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

  it('keeps long dialogs within the viewport and lets actions scroll into view', () => {
    const panel: HTMLElement = fixture.nativeElement.querySelector('.bg-white');
    const actions = panel.lastElementChild!;
    const content = document.createElement('div');
    content.style.height = '200vh';
    panel.insertBefore(content, actions);

    const bounds = panel.getBoundingClientRect();
    expect(bounds.top).toBeGreaterThanOrEqual(16);
    expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight - 16);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);

    panel.scrollTop = panel.scrollHeight;
    expect(panel.scrollTop).toBeGreaterThan(0);
    const actionBounds = actions.getBoundingClientRect();
    expect(actionBounds.top).toBeGreaterThanOrEqual(bounds.top);
    expect(actionBounds.bottom).toBeLessThanOrEqual(bounds.bottom);
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

  ['revoke', 'reject', 'delete'].forEach((action) => {
    it(`should show textarea when action is ${action} and textareaControl is provided`, () => {
      fixture.componentRef.setInput('type', action);
      fixture.componentRef.setInput('textareaControl', new FormControl(''));
      fixture.detectChanges();
      const textarea = fixture.nativeElement.querySelector('#modal-textarea');
      expect(textarea).toBeTruthy();
    });
  });
});
