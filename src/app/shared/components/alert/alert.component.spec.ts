import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display success alert with correct styling', () => {
    fixture.componentRef.setInput('type', 'success');
    fixture.componentRef.setInput('message', 'Success message');
    fixture.detectChanges();

    const alertDiv = fixture.debugElement.query(By.css('.fixed'));
    const icon = fixture.debugElement.query(By.css('.text-green-500'));
    const messageDiv = fixture.debugElement.query(By.css('.text-green-700'));

    expect(alertDiv.nativeElement).toHaveClass('bg-green-50');
    expect(icon).toBeTruthy();
    expect(messageDiv.nativeElement.textContent.trim()).toBe('Success message');
  });

  it('should display error alert with correct styling', () => {
    fixture.componentRef.setInput('type', 'error');
    fixture.componentRef.setInput('message', 'Error message');
    fixture.detectChanges();

    const alertDiv = fixture.debugElement.query(By.css('.fixed'));
    const icon = fixture.debugElement.query(By.css('.text-red-500'));
    const messageDiv = fixture.debugElement.query(By.css('.text-red-700'));

    expect(alertDiv.nativeElement).toHaveClass('bg-red-50');
    expect(icon).toBeTruthy();
    expect(messageDiv.nativeElement.textContent.trim()).toBe('Error message');
  });

  it('should show dismiss button when dismissible is true', () => {
    fixture.componentRef.setInput('dismissible', true);
    fixture.detectChanges();

    const dismissButton = fixture.debugElement.query(By.css('button'));
    expect(dismissButton).toBeTruthy();
  });

  it('should not show dismiss button when dismissible is false', () => {
    fixture.componentRef.setInput('dismissible', false);
    fixture.detectChanges();

    const dismissButton = fixture.debugElement.query(By.css('button'));
    expect(dismissButton).toBeFalsy();
  });

  it('should emit dismissed event when dismiss button is clicked', () => {
    spyOn(component.dismissed, 'emit');
    fixture.componentRef.setInput('dismissible', true);
    fixture.detectChanges();

    const dismissButton = fixture.debugElement.query(By.css('button'));
    dismissButton.nativeElement.click();

    expect(component.dismissed.emit).toHaveBeenCalled();
  });

  it('should apply custom position class', () => {
    fixture.componentRef.setInput('positionClass', 'left-4 bottom-4');
    fixture.detectChanges();

    const alertDiv = fixture.debugElement.query(By.css('.fixed'));
    expect(alertDiv.nativeElement).toHaveClass('left-4');
    expect(alertDiv.nativeElement).toHaveClass('bottom-4');
  });
});
