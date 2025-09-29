import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export const ALLOWED_SPECIAL_CHARACTERS = '!@#$%^&*';

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
  const regex = new RegExp(`[${ALLOWED_SPECIAL_CHARACTERS}]`);
  const ok = regex.test(control.value);
  return ok ? null : { specialCharacterRequired: true };
}

export function passwordRequirements(
  control: AbstractControl,
): PasswordErrors | null {
  const combined_validator = Validators.compose([
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(128),
    lowercaseRequired,
    uppercaseRequired,
    digitRequired,
    specialCharacterRequired,
  ]);
  return combined_validator!(control);
}
