import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { passwordRequirements } from '../../validators/passwords';

@Component({
  selector: 'app-password-edit-field',
  standalone: true,
  templateUrl: './password-edit-field.component.html',
  host: { class: 'block' },
})
export class PasswordEditFieldComponent {
  /** Whether a save request is in progress (parent controls this). */
  @Input() saving = false;

  /**
   * Emitted when user submits the form.
   * Parent will handle the API call and then call `cancel()` on success.
   */
  @Output() changePassword = new EventEmitter<{
    currentPassword: string;
    newPassword: string;
  }>();

  isEditing = signal(false);
  currentPassword = signal('');
  newPassword = signal('');
  error = signal<string | null>(null);

  newPasswordControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [passwordRequirements],
  });

  startEdit(): void {
    this.isEditing.set(true);
    this.currentPassword.set('');
    this.newPassword.set('');
    this.error.set(null);
  }

  cancel(): void {
    this.isEditing.set(false);
    this.currentPassword.set('');
    this.newPassword.set('');
    this.error.set(null);
  }

  onNewPasswordChange(value: string) {
    this.newPasswordControl.setValue(value);
  }

  submit(): void {
    const current = this.currentPassword().trim();

    this.newPasswordControl.markAsTouched();
    this.newPasswordControl.updateValueAndValidity();

    const next = this.newPasswordControl.value.trim();

    if (!current || !next) {
      this.error.set('Both current and new password are required.');
      return;
    }

    if (this.newPasswordControl.invalid) {
      this.error.set('New password does not meet the password requirements.');
      return;
    }

    if (current === next) {
      this.error.set('New password must be different from current password.');
      return;
    }

    this.error.set(null);
    this.changePassword.emit({
      currentPassword: current,
      newPassword: next,
    });
  }
}
