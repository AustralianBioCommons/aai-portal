import { Injectable } from '@angular/core';
import { FormGroup, ValidationErrors } from '@angular/forms';
import { ALLOWED_SPECIAL_CHARACTERS } from '../../shared/validators/passwords';
import { HttpErrorResponse } from '@angular/common/http';

export interface RegistrationFieldError {
  field: string;
  message: string;
}

export interface RegistrationErrorResponse {
  message: string;
  field_errors: RegistrationFieldError[];
}

/**
 * Form validation service to reuse across our registration forms.
 * Has common definitions of when a field is invalid, along with some
 * common error messages for our fields (these can be overridden for
 * specific forms)
 */
@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  private defaultErrorMessages: Record<string, string> = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    passwordMismatch: 'Passwords do not match',
    passwordMustBeDifferent:
      'New password must be different from the current password',
  };

  private fieldSpecificErrorMessages: Record<string, Record<string, string>> = {
    password: {
      minlength: 'Password must be at least 8 characters',
      maxlength: 'Password cannot be longer than 72 characters',
      lowercaseRequired: 'Password must contain at least one lowercase letter',
      uppercaseRequired: 'Password must contain at least one uppercase letter',
      digitRequired: 'Password must contain at least one digit',
      specialCharacterRequired: `Password must contain at least one special character (${ALLOWED_SPECIAL_CHARACTERS})`,
    },
    username: {
      minlength: 'Your username needs at least 3 characters',
      maxlength: 'Your username cannot be longer than 128 characters',
      pattern:
        'Your username must start with a lowercase letter and can only include lowercase letters, numbers, underscores, or dashes',
      valueUnchanged:
        'New username must be different from the current username',
    },
    email: {
      invalidSbpEmailDomain:
        'Email must be from an authorized institution domain (UNSW, BioCommons, USyd, WEHI, Monash, Griffith, or UoM)',
      localPartTooLong: 'Email local part cannot exceed 64 characters',
      domainPartTooLong: 'Email domain cannot exceed 254 characters',
      valueUnchanged: 'New email must be different from the current email',
    },
    firstName: {
      maxlength: 'First name cannot be longer than 150 characters',
      fullNameTooLong: 'Full name cannot be longer than 300 characters',
    },
    lastName: {
      maxlength: 'Last name cannot be longer than 150 characters',
      fullNameTooLong: 'Full name cannot be longer than 300 characters',
    },
    fullName: {
      maxlength: 'Full name cannot be longer than 300 characters',
    },
    reason: {
      maxlength: 'Reason for request cannot be longer than 255 characters',
    },
    confirmPassword: {
      maxlength: 'Confirm password cannot be longer than 72 characters',
    },
    projectOfInterest: {
      maxlength: 'Project of interest cannot be longer than 255 characters',
    },
    newPassword: {
      minlength: 'Password must be at least 8 characters',
      maxlength: 'Password cannot be longer than 72 characters',
      lowercaseRequired: 'Password must contain at least one lowercase letter',
      uppercaseRequired: 'Password must contain at least one uppercase letter',
      digitRequired: 'Password must contain at least one digit',
      specialCharacterRequired: `Password must contain at least one special character (${ALLOWED_SPECIAL_CHARACTERS})`,
    },
  };

  private backendErrorMessages: Record<string, string> = {};

  /**
   * Processes the error response from the backend and sets the error messages
   * for the form fields that are invalid.
   */
  setBackendErrorMessages(response: HttpErrorResponse) {
    // Check if the response matches our expected format
    function isRegistrationError(
      error: unknown,
    ): error is RegistrationErrorResponse {
      return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        'field_errors' in error
      );
    }

    if (isRegistrationError(response.error)) {
      response.error.field_errors.forEach(
        (fieldError: RegistrationFieldError) => {
          this.backendErrorMessages[fieldError.field] = fieldError.message;
        },
      );
    }
  }

  /**
   * Checks if a specific field has a backend error.
   * @param fieldName The field name to check
   * @returns True if the field has a backend error
   */
  hasFieldBackendError(fieldName: string): boolean {
    return fieldName in this.backendErrorMessages;
  }

  /**
   * Clears the backend error message for a specific field.
   * @param fieldName The field name to clear the error for
   */
  clearFieldBackendError(fieldName: string) {
    delete this.backendErrorMessages[fieldName];
  }

  /**
   * Checks if there are any backend error messages.
   * @returns True if there are any backend errors
   */
  hasBackendErrors(): boolean {
    return Object.keys(this.backendErrorMessages).length > 0;
  }

  /**
   * Resets the backend error messages for all fields.
   */
  resetBackendErrors() {
    this.backendErrorMessages = {};
  }

  /**
   * Gets error messages for a form control
   * @param form The form group containing the control
   * @param fieldName The name of the control to get error messages for
   * @returns Array of error messages
   */
  getErrorMessages(form: FormGroup, fieldName: string): string[] {
    const control = form.get(fieldName)!;
    const inputValid = !control?.errors;
    const backendValid = !this.backendErrorMessages[fieldName];
    const formValid = !form.errors;
    if (inputValid && backendValid && formValid) return [];

    // Return all error messages that apply to this control
    const inputErrors = Object.keys(control.errors || {})
      .filter(
        (key) =>
          this.fieldSpecificErrorMessages[fieldName]?.[key] ||
          this.defaultErrorMessages[key],
      )
      .map(
        (key) =>
          this.fieldSpecificErrorMessages[fieldName]?.[key] ||
          this.defaultErrorMessages[key] ||
          `Error: ${key}`,
      );

    // Check form-level errors that apply to this field
    if (form.errors) {
      Object.keys(form.errors)
        .filter((key) => this.fieldSpecificErrorMessages[fieldName]?.[key])
        .forEach((key) => {
          const message = this.fieldSpecificErrorMessages[fieldName]?.[key];
          if (message) {
            inputErrors.push(message);
          }
        });
    }

    if (this.backendErrorMessages[fieldName]) {
      inputErrors.push(this.backendErrorMessages[fieldName]);
    }
    return inputErrors;
  }

  /**
   * Checks if a field is invalid and has been touched/dirty
   * @param form The form group containing the control
   * @param fieldName The name of the control to check
   * @returns True if the field is invalid and touched/dirty
   */
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    const invalidInput = !!(field?.invalid && (field?.dirty || field?.touched));

    // Check if there are form-level errors that apply to this field
    const hasFormLevelError = !!(
      form.errors &&
      field?.touched &&
      Object.keys(form.errors).some(
        (key) => this.fieldSpecificErrorMessages[fieldName]?.[key],
      )
    );

    return (
      invalidInput ||
      hasFormLevelError ||
      !!this.backendErrorMessages[fieldName]
    );
  }

  /**
   * Adds custom error messages for specific fields
   * @param fieldName The field name to add error messages for
   * @param errorMessages Record of error key to error message mappings
   */
  addFieldErrorMessages(
    fieldName: string,
    errorMessages: Record<string, string>,
  ): void {
    this.fieldSpecificErrorMessages[fieldName] = {
      ...(this.fieldSpecificErrorMessages[fieldName] || {}),
      ...errorMessages,
    };
  }

  /**
   * Adds or updates default error messages that apply to all fields
   * @param errorMessages Record of error key to error message mappings
   */
  addDefaultErrorMessages(errorMessages: Record<string, string>): void {
    this.defaultErrorMessages = {
      ...this.defaultErrorMessages,
      ...errorMessages,
    };
  }

  /**
   * Creates a password confirmation validator for a form control
   * @param formGroup The parent form group
   * @param passwordFieldName Name of the password field (default: 'password')
   * @param confirmFieldName Name of the confirm field (default: 'confirmPassword')
   * @returns Validator function
   */
  createPasswordConfirmationValidator(
    formGroup: FormGroup,
    passwordFieldName = 'password',
    confirmFieldName = 'confirmPassword',
  ) {
    return (): ValidationErrors | null => {
      const password = formGroup?.get(passwordFieldName)?.value;
      const confirm = formGroup?.get(confirmFieldName)?.value;
      return password === confirm ? null : { passwordMismatch: true };
    };
  }

  /**
   * Sets up validation to ensure new password is different from current password
   * @param form The form group containing password fields
   * @param currentPasswordFieldName Name of the current password field
   * @param newPasswordFieldName Name of the new password field
   */
  setupPasswordDifferentValidation(
    form: FormGroup,
    currentPasswordFieldName = 'currentPassword',
    newPasswordFieldName = 'newPassword',
  ): void {
    const validator = (): ValidationErrors | null => {
      const current = form?.get(currentPasswordFieldName)?.value;
      const newPass = form?.get(newPasswordFieldName)?.value;
      if (!current || !newPass) return null;
      return current !== newPass ? null : { passwordMustBeDifferent: true };
    };

    form.get(newPasswordFieldName)?.addValidators(validator);

    form.get(currentPasswordFieldName)?.valueChanges.subscribe(() => {
      form.get(newPasswordFieldName)?.updateValueAndValidity();
    });
  }

  /**
   * Sets up password confirmation validation for a form
   * @param form The form group containing password fields
   * @param passwordFieldName Name of the password field (default: 'password')
   * @param confirmFieldName Name of the confirm password field (default: 'confirmPassword')
   */
  setupPasswordConfirmationValidation(
    form: FormGroup,
    passwordFieldName = 'password',
    confirmFieldName = 'confirmPassword',
  ): void {
    form
      .get(confirmFieldName)
      ?.addValidators(
        this.createPasswordConfirmationValidator(
          form,
          passwordFieldName,
          confirmFieldName,
        ),
      );

    form.get(passwordFieldName)?.valueChanges.subscribe(() => {
      form.get(confirmFieldName)?.updateValueAndValidity();
    });
  }

  /**
   * Creates a validator that checks if the value has changed from the original
   * @param originalValue The original value to compare against
   * @param compareTransform Optional function to transform values before comparison (e.g., trim)
   * @returns Validator function
   */
  valueUnchangedValidator(
    originalValue: string | null | undefined,
    compareTransform: (value: string) => string = (v) => v.trim(),
  ) {
    return (control: { value: string }): { valueUnchanged: boolean } | null => {
      if (!control.value) {
        return null;
      }
      const transformedValue = compareTransform(control.value);
      const transformedOriginal = originalValue
        ? compareTransform(originalValue)
        : '';
      return transformedValue === transformedOriginal
        ? { valueUnchanged: true }
        : null;
    };
  }
}
