import { Injectable } from '@angular/core';
import { FormGroup} from '@angular/forms';
import {ALLOWED_SPECIAL_CHARACTERS} from '../../../utils/validation/passwords';

/**
 * Form validation service to reuse across our registration forms.
 * Has common definitions of when a field is invalid, along with some
 * common error messages for our fields (these can be overridden for
 * specific forms)
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private defaultErrorMessages: Record<string, string> = {
    'required': 'This field is required',
    'email': 'Please enter a valid email address',
    'passwordMismatch': 'Passwords do not match',
  };

  private fieldSpecificErrorMessages: Record<string, Record<string, string>> = {
    'password': {
      'minlength': 'Password must be at least 8 characters',
      'maxlength': 'Password cannot be longer than 128 characters',
      'lowercaseRequired': 'Password must contain at least one lowercase letter',
      'uppercaseRequired': 'Password must contain at least one uppercase letter',
      'digitRequired': 'Password must contain at least one digit',
      'specialCharacterRequired': `Password must contain at least one special character (${ALLOWED_SPECIAL_CHARACTERS})`
    },
    'username': {
      'minlength': 'Your username needs at least 3 characters',
      'maxlength': 'Your username cannot be longer than 100 characters',
      'pattern': 'Your username should contain only lower-case letters, numbers, dots, underscores and dashes',
    }
  };

  /**
   * Gets error messages for a form control
   * @param form The form group containing the control
   * @param fieldName The name of the control to get error messages for
   * @returns Array of error messages
   */
  getErrorMessages(form: FormGroup, fieldName: string): string[] {
    const control = form.get(fieldName);
    if (!control?.errors) return [];

    // Return all error messages that apply to this control
    return Object.keys(control.errors)
      .filter(key =>
        this.fieldSpecificErrorMessages[fieldName]?.[key] || this.defaultErrorMessages[key]
      )
      .map(key =>
        this.fieldSpecificErrorMessages[fieldName]?.[key] || this.defaultErrorMessages[key] || `Error: ${key}`
      );
  }

  /**
   * Checks if a field is invalid and has been touched/dirty
   * @param form The form group containing the control
   * @param fieldName The name of the control to check
   * @returns True if the field is invalid and touched/dirty
   */
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  /**
   * Adds custom error messages for specific fields
   * @param fieldName The field name to add error messages for
   * @param errorMessages Record of error key to error message mappings
   */
  addFieldErrorMessages(fieldName: string, errorMessages: Record<string, string>): void {
    this.fieldSpecificErrorMessages[fieldName] = {
      ...(this.fieldSpecificErrorMessages[fieldName] || {}),
      ...errorMessages
    };
  }

  /**
   * Adds or updates default error messages that apply to all fields
   * @param errorMessages Record of error key to error message mappings
   */
  addDefaultErrorMessages(errorMessages: Record<string, string>): void {
    this.defaultErrorMessages = {
      ...this.defaultErrorMessages,
      ...errorMessages
    };
  }
}
