import { AbstractControl, ValidationErrors } from '@angular/forms';

export const ALLOWED_SPECIAL_CHARACTERS = '!@#$%^&*';

export function lowercaseRequired(control: AbstractControl): ValidationErrors | null {
  const ok = /[a-z]/.test(control.value);
  return ok ? null : {lowercaseRequired: true};
}

export function uppercaseRequired(control: AbstractControl): ValidationErrors | null {
  const ok = /[A-Z]/.test(control.value);
  return ok ? null : {uppercaseRequired: true};
}

export function digitRequired(control: AbstractControl): ValidationErrors | null {
  const ok = /[0-9]/.test(control.value);
  return ok ? null : {digitRequired: true};
}

export function specialCharacterRequired(control: AbstractControl): ValidationErrors | null {
  const regex = new RegExp(`[${ALLOWED_SPECIAL_CHARACTERS}]`);
  const ok = regex.test(control.value);
  return ok ? null : {specialCharacterRequired: true};
}

export function passwordRequirements(control: AbstractControl): ValidationErrors | null {
  return {...lowercaseRequired(control),
          ...uppercaseRequired(control),
          ...digitRequired(control),
         ...specialCharacterRequired(control)}
}
