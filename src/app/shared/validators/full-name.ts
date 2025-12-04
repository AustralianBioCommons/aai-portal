import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormGroup,
} from '@angular/forms';

export function fullNameLengthValidator(maxLength = 255): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) {
      return null;
    }

    const firstNameControl = group.get('firstName');
    const lastNameControl = group.get('lastName');

    if (!firstNameControl || !lastNameControl) {
      return null;
    }

    const sanitize = (value: string | null | undefined): string =>
      (value ?? '').trim();

    const firstName = sanitize(firstNameControl.value);
    const lastName = sanitize(lastNameControl.value);
    const combined = [firstName, lastName].filter(Boolean).join(' ');

    if (combined.length > maxLength) {
      return { fullNameTooLong: true };
    }

    return null;
  };
}
