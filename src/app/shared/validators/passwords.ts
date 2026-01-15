import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

const PASSWORD_MIN_LENGTH = 8;
// Auth0 'allows' passwords longer than 72, but silently ignores any chars beyond 72.
// Make the max length explicit
const PASSWORD_MAX_LENGTH = 72;
// Characters that count as special characters in passwords, used
// in Auth0's requirements, from OWASP: https://owasp.org/www-community/password-special-characters
export const ALLOWED_SPECIAL_CHARACTERS = ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
// Escaping is tricky here so manually define the regex
export const SPECIAL_CHARACTERS_REGEX =
  /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

interface PasswordErrors {
  required?: boolean;
  minlength?: { requiredLength: number; actualLength: number };
  maxlength?: { requiredLength: number; actualLength: number };
  lowercaseRequired?: boolean;
  uppercaseRequired?: boolean;
  digitRequired?: boolean;
  specialCharacterRequired?: boolean;
}

export function lowercaseRequired(
  control: AbstractControl,
): ValidationErrors | null {
  const ok = /[a-z]/.test(control.value);
  return ok ? null : { lowercaseRequired: true };
}

export function uppercaseRequired(
  control: AbstractControl,
): ValidationErrors | null {
  const ok = /[A-Z]/.test(control.value);
  return ok ? null : { uppercaseRequired: true };
}

export function digitRequired(
  control: AbstractControl,
): ValidationErrors | null {
  const ok = /[0-9]/.test(control.value);
  return ok ? null : { digitRequired: true };
}

export function specialCharacterRequired(
  control: AbstractControl,
): ValidationErrors | null {
  const ok = SPECIAL_CHARACTERS_REGEX.test(control.value);
  return ok ? null : { specialCharacterRequired: true };
}

export function passwordRequirements(
  control: AbstractControl,
): PasswordErrors | null {
  const combined_validator = Validators.compose([
    Validators.required,
    Validators.minLength(PASSWORD_MIN_LENGTH),
    Validators.maxLength(PASSWORD_MAX_LENGTH),
    lowercaseRequired,
    uppercaseRequired,
    digitRequired,
    specialCharacterRequired,
  ]);
  return combined_validator!(control);
}
