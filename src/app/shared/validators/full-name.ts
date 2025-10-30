import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function fullNameLengthValidator(maxLength = 255): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();

    if (!value) {
      return null;
    }

    return value.length > maxLength ? { fullNameTooLong: true } : null;
  };
}
