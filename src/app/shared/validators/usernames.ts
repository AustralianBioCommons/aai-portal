import { AbstractControl, Validators } from '@angular/forms';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 128;

interface UsernameErrors {
  required?: boolean;
  minlength?: { requiredLength: number; actualLength: number };
  maxlength?: { requiredLength: number; actualLength: number };
  pattern?: boolean;
}

/**
 * Validate requirements for our usernames in Auth0.
 * Min length of 3 (based on platform requirements)
 * Max length of 128 (from Auth0)
 * lowercase letters, digits, hyphen and underscore only (based on platform requirements)
 * must start with a lowercase letter
 */
export function usernameRequirements(
  control: AbstractControl,
): UsernameErrors | null {
  const validator = Validators.compose([
    Validators.required,
    Validators.minLength(USERNAME_MIN_LENGTH),
    Validators.maxLength(USERNAME_MAX_LENGTH),
    Validators.pattern(/^[a-z][a-z0-9_-]*$/),
  ]);
  return validator!(control);
}
