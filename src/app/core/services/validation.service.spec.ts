import { TestBed } from '@angular/core/testing';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { ValidationService } from './validation.service';
import {
  ALLOWED_SPECIAL_CHARACTERS,
  passwordRequirements,
} from '../../shared/validators/passwords';
import { usernameRequirements } from '../../shared/validators/usernames';
import { HttpErrorResponse } from '@angular/common/http';

describe('ValidationService', () => {
  let service: ValidationService;
  let formBuilder: FormBuilder;
  let testForm: FormGroup;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ValidationService, FormBuilder],
    });

    service = TestBed.inject(ValidationService);
    formBuilder = TestBed.inject(FormBuilder);

    // Create a test form with common fields
    testForm = formBuilder.group({
      username: ['', [usernameRequirements]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [passwordRequirements]],
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isFieldInvalid', () => {
    it('should return false for valid fields', () => {
      testForm.patchValue({
        username: 'validuser',
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });

      expect(service.isFieldInvalid(testForm, 'username')).toBeFalse();
      expect(service.isFieldInvalid(testForm, 'email')).toBeFalse();
      expect(service.isFieldInvalid(testForm, 'password')).toBeFalse();
    });

    it('should return false for invalid fields that have not been touched', () => {
      // Form controls are invalid but not touched/dirty
      expect(service.isFieldInvalid(testForm, 'username')).toBeFalse();
      expect(service.isFieldInvalid(testForm, 'email')).toBeFalse();
      expect(service.isFieldInvalid(testForm, 'password')).toBeFalse();
    });

    it('should return true for invalid touched fields', () => {
      // Mark fields as touched
      testForm.get('username')?.markAsTouched();
      testForm.get('email')?.markAsTouched();
      testForm.get('password')?.markAsTouched();

      expect(service.isFieldInvalid(testForm, 'username')).toBeTrue();
      expect(service.isFieldInvalid(testForm, 'email')).toBeTrue();
      expect(service.isFieldInvalid(testForm, 'password')).toBeTrue();
    });

    it('should return true for invalid dirty fields', () => {
      // Mark fields as dirty
      testForm.get('username')?.markAsDirty();
      testForm.get('email')?.markAsDirty();
      testForm.get('password')?.markAsDirty();

      expect(service.isFieldInvalid(testForm, 'username')).toBeTrue();
      expect(service.isFieldInvalid(testForm, 'email')).toBeTrue();
      expect(service.isFieldInvalid(testForm, 'password')).toBeTrue();
    });

    it('should handle non-existent fields', () => {
      expect(service.isFieldInvalid(testForm, 'nonExistentField')).toBeFalse();
    });
  });

  describe('getErrorMessages', () => {
    it('should return an empty array for fields without errors', () => {
      testForm.patchValue({
        username: 'validuser',
        email: 'test@example.com',
        password: 'ValidPassword123!',
      });

      expect(service.getErrorMessages(testForm, 'username')).toEqual([]);
      expect(service.getErrorMessages(testForm, 'email')).toEqual([]);
      expect(service.getErrorMessages(testForm, 'password')).toEqual([]);
    });

    it('should return correct error messages for required fields', () => {
      testForm.get('username')?.markAsTouched();
      testForm.get('email')?.markAsTouched();

      expect(service.getErrorMessages(testForm, 'username')).toContain(
        'This field is required',
      );
      expect(service.getErrorMessages(testForm, 'email')).toContain(
        'This field is required',
      );
    });

    it('should return field-specific error messages for username', () => {
      testForm.patchValue({ username: 'ab' });
      testForm.get('username')?.markAsTouched();

      const errors = service.getErrorMessages(testForm, 'username');
      expect(errors).toContain('Your username needs at least 3 characters');
    });

    it('should return field-specific error messages for password', () => {
      testForm.patchValue({ password: 'short' });
      testForm.get('password')?.markAsTouched();

      const errors = service.getErrorMessages(testForm, 'password');
      expect(errors).toContain('Password must be at least 8 characters');
    });

    it('should return default error messages when field-specific ones are not available', () => {
      // Add a field without specific error messages
      testForm.addControl(
        'genericField',
        new FormControl('', Validators.required),
      );
      testForm.get('genericField')?.markAsTouched();

      const errors = service.getErrorMessages(testForm, 'genericField');
      expect(errors).toContain('This field is required');
    });

    it('should handle non-existent fields', () => {
      expect(service.getErrorMessages(testForm, 'nonExistentField')).toEqual(
        [],
      );
    });

    it('should include special characters in password error message', () => {
      // Add a password field with special character error
      testForm.patchValue({ password: 'Password123' });
      testForm.get('password')?.markAsTouched();

      const errors = service.getErrorMessages(testForm, 'password');
      const expectedErrorMessage = `Password must contain at least one special character (${ALLOWED_SPECIAL_CHARACTERS})`;
      expect(
        errors.some((msg) => msg.includes(expectedErrorMessage)),
      ).toBeTrue();
    });
  });

  describe('addFieldErrorMessages', () => {
    it('should add new error messages for a field', () => {
      // Add custom error messages for a new field
      service.addFieldErrorMessages('customField', {
        custom: 'This is a custom error message',
      });

      // Create a control with the custom error
      const control = new FormControl('', { validators: [] });
      control.setErrors({ custom: true });
      testForm.addControl('customField', control);

      const errors = service.getErrorMessages(testForm, 'customField');
      expect(errors).toContain('This is a custom error message');
    });

    it('should override existing error messages for a field', () => {
      // Override existing username error message
      service.addFieldErrorMessages('username', {
        minlength: 'Custom minlength message',
      });

      testForm.patchValue({ username: 'ab' });
      testForm.get('username')?.markAsTouched();

      const errors = service.getErrorMessages(testForm, 'username');
      expect(errors).toContain('Custom minlength message');
      expect(errors).not.toContain('Your username needs at least 3 characters');
    });

    it('should merge new error messages with existing ones', () => {
      // Add a new error message to username without overriding existing ones
      service.addFieldErrorMessages('username', {
        newError: 'This is a new error type',
      });

      // Create control with both errors
      const control = new FormControl('', { validators: [] });
      control.setErrors({ minlength: true, newError: true });
      testForm.removeControl('username');
      testForm.addControl('username', control);

      const errors = service.getErrorMessages(testForm, 'username');
      expect(errors).toContain('Your username needs at least 3 characters');
      expect(errors).toContain('This is a new error type');
    });
  });

  describe('addDefaultErrorMessages', () => {
    it('should add new default error messages', () => {
      // Add a custom default error message
      service.addDefaultErrorMessages({
        customDefault: 'This is a custom default error',
      });

      // Create a control with the custom error
      const control = new FormControl('', { validators: [] });
      control.setErrors({ customDefault: true });
      testForm.addControl('anyField', control);

      const errors = service.getErrorMessages(testForm, 'anyField');
      expect(errors).toContain('This is a custom default error');
    });

    it('should override existing default error messages', () => {
      // Override the default 'required' error message
      service.addDefaultErrorMessages({
        required: 'Field must be filled out',
      });

      testForm.get('username')?.markAsTouched();

      const errors = service.getErrorMessages(testForm, 'username');
      expect(errors).toContain('Field must be filled out');
      expect(errors).not.toContain('This field is required');
    });

    it('should merge new default error messages with existing ones', () => {
      // Add a new default error without overriding existing ones
      service.addDefaultErrorMessages({
        newDefaultError: 'This is a new default error type',
      });

      // Create control with both errors
      const control = new FormControl('', { validators: [] });
      control.setErrors({ required: true, newDefaultError: true });
      testForm.removeControl('email');
      testForm.addControl('email', control);

      const errors = service.getErrorMessages(testForm, 'email');
      expect(errors).toContain('This field is required');
      expect(errors).toContain('This is a new default error type');
    });
  });

  describe('multiple errors', () => {
    it('should return multiple error messages when a field has multiple errors', () => {
      // Setup form with email validation errors
      testForm.patchValue({ email: 'invalid-email' });
      testForm.get('email')?.markAsTouched();

      const errors = service.getErrorMessages(testForm, 'email');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Please enter a valid email address');
    });
  });

  describe('precedence', () => {
    it('should prioritize field-specific error messages over default ones', () => {
      // Add a field-specific and default error message for the same error
      service.addFieldErrorMessages('testField', {
        required: 'Field-specific required message',
      });

      service.addDefaultErrorMessages({
        required: 'Default required message',
      });

      // Create a control with the required error
      const control = new FormControl('', Validators.required);
      control.markAsTouched();
      testForm.addControl('testField', control);

      const errors = service.getErrorMessages(testForm, 'testField');
      expect(errors).toContain('Field-specific required message');
      expect(errors).not.toContain('Default required message');
    });
  });

  describe('setBackendErrorMessages', () => {
    it('should process backend field errors and make fields invalid', () => {
      // Create a mock HTTP error response with field errors
      const mockErrorResponse = {
        error: {
          message: 'Registration failed',
          field_errors: [
            { field: 'username', message: 'Username already exists' },
            { field: 'email', message: 'Email is already registered' },
          ],
        },
      } as HttpErrorResponse;

      // Call setBackendErrorMessages
      service.setBackendErrorMessages(mockErrorResponse);

      // Fields should now be invalid due to backend errors
      expect(service.isFieldInvalid(testForm, 'username')).toBeTrue();
      expect(service.isFieldInvalid(testForm, 'email')).toBeTrue();
    });

    it('should return backend error messages when calling getErrorMessages', () => {
      // Create a mock HTTP error response with field errors
      const mockErrorResponse = {
        error: {
          message: 'Registration failed',
          field_errors: [
            { field: 'username', message: 'Username already exists' },
            { field: 'email', message: 'Email is already registered' },
          ],
        },
      } as HttpErrorResponse;

      // Call setBackendErrorMessages
      service.setBackendErrorMessages(mockErrorResponse);

      // Should return the backend error messages
      const usernameErrors = service.getErrorMessages(testForm, 'username');
      const emailErrors = service.getErrorMessages(testForm, 'email');

      expect(usernameErrors).toContain('Username already exists');
      expect(emailErrors).toContain('Email is already registered');
    });
  });

  describe('valueUnchangedValidator', () => {
    it('should return null when value is empty', () => {
      const validator = service.valueUnchangedValidator('original');
      const control = { value: '' };
      expect(validator(control)).toBeNull();
    });

    it('should return null when value has changed', () => {
      const validator = service.valueUnchangedValidator('original');
      const control = { value: 'new-value' };
      expect(validator(control)).toBeNull();
    });

    it('should return error when value is unchanged', () => {
      const validator = service.valueUnchangedValidator('original');
      const control = { value: 'original' };
      expect(validator(control)).toEqual({ valueUnchanged: true });
    });

    it('should trim values before comparison by default', () => {
      const validator = service.valueUnchangedValidator('original');
      const control = { value: '  original  ' };
      expect(validator(control)).toEqual({ valueUnchanged: true });
    });

    it('should handle null original value', () => {
      const validator = service.valueUnchangedValidator(null);
      const control = { value: 'something' };
      expect(validator(control)).toBeNull();
    });

    it('should handle undefined original value', () => {
      const validator = service.valueUnchangedValidator(undefined);
      const control = { value: 'something' };
      expect(validator(control)).toBeNull();
    });

    it('should use custom comparison transform', () => {
      const validator = service.valueUnchangedValidator('ORIGINAL', (v) =>
        v.toLowerCase(),
      );
      const control = { value: 'original' };
      expect(validator(control)).toEqual({ valueUnchanged: true });
    });

    it('should work with form control', () => {
      const form = formBuilder.group({
        username: ['testuser'],
      });

      form
        .get('username')
        ?.addValidators(service.valueUnchangedValidator('testuser'));
      form.get('username')?.updateValueAndValidity();

      expect(form.get('username')?.hasError('valueUnchanged')).toBeTrue();

      form.patchValue({ username: 'newuser' });
      expect(form.get('username')?.hasError('valueUnchanged')).toBeFalse();
    });
  });

  describe('setupPasswordDifferentValidation', () => {
    let passwordForm: FormGroup;

    beforeEach(() => {
      passwordForm = formBuilder.group({
        currentPassword: ['', Validators.required],
        newPassword: ['', passwordRequirements],
      });
    });

    it('should add validator to newPassword field', () => {
      service.setupPasswordDifferentValidation(passwordForm);

      passwordForm.patchValue({
        currentPassword: 'OldPass123!',
        newPassword: 'OldPass123!',
      });

      expect(
        passwordForm.get('newPassword')?.hasError('passwordMustBeDifferent'),
      ).toBeTrue();
    });

    it('should return null when passwords are different', () => {
      service.setupPasswordDifferentValidation(passwordForm);

      passwordForm.patchValue({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      });

      expect(
        passwordForm.get('newPassword')?.hasError('passwordMustBeDifferent'),
      ).toBeFalsy();
    });

    it('should return null when either password is empty', () => {
      service.setupPasswordDifferentValidation(passwordForm);

      passwordForm.patchValue({
        currentPassword: '',
        newPassword: 'NewPass123!',
      });

      expect(
        passwordForm.get('newPassword')?.hasError('passwordMustBeDifferent'),
      ).toBeFalsy();

      passwordForm.patchValue({
        currentPassword: 'OldPass123!',
        newPassword: '',
      });

      expect(
        passwordForm.get('newPassword')?.hasError('passwordMustBeDifferent'),
      ).toBeFalsy();
    });

    it('should revalidate newPassword when currentPassword changes', () => {
      service.setupPasswordDifferentValidation(passwordForm);

      passwordForm.patchValue({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      });

      expect(
        passwordForm.get('newPassword')?.hasError('passwordMustBeDifferent'),
      ).toBeFalsy();

      // Change currentPassword to match newPassword
      passwordForm.patchValue({
        currentPassword: 'NewPass123!',
      });

      expect(
        passwordForm.get('newPassword')?.hasError('passwordMustBeDifferent'),
      ).toBeTrue();
    });

    it('should work with custom field names', () => {
      const customForm = formBuilder.group({
        oldPass: ['', Validators.required],
        newPass: ['', passwordRequirements],
      });

      service.setupPasswordDifferentValidation(
        customForm,
        'oldPass',
        'newPass',
      );

      customForm.patchValue({
        oldPass: 'SamePass123!',
        newPass: 'SamePass123!',
      });

      expect(
        customForm.get('newPass')?.hasError('passwordMustBeDifferent'),
      ).toBeTrue();
    });
  });
});
