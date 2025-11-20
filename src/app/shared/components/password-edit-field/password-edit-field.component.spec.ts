import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordEditFieldComponent } from './password-edit-field.component';

describe('PasswordEditFieldComponent', () => {
  let component: PasswordEditFieldComponent;
  let fixture: ComponentFixture<PasswordEditFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordEditFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordEditFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits changePassword for a valid current/new pair', () => {
    const emitSpy = spyOn(component.changePassword, 'emit');
    component.startEdit();
    component.currentPassword.set('Current123!');
    component.onNewPasswordChange('NewPassword1!');

    component.submit();

    expect(component.error()).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith({
      currentPassword: 'Current123!',
      newPassword: 'NewPassword1!',
    });
  });

  it('shows an error when the new password is invalid', () => {
    const emitSpy = spyOn(component.changePassword, 'emit');
    component.startEdit();
    component.currentPassword.set('Current123!');
    component.onNewPasswordChange('short');

    component.submit();

    expect(component.error()).toBe(
      'New password does not meet the password requirements.',
    );
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('shows an error when the new password matches the current password', () => {
    const emitSpy = spyOn(component.changePassword, 'emit');
    const password = 'Current123!';
    component.startEdit();
    component.currentPassword.set(password);
    component.onNewPasswordChange(password);

    component.submit();

    expect(component.error()).toBe(
      'New password must be different from current password.',
    );
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
