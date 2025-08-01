import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

interface UsernameErrors {
  minLength?: boolean;
  maxLength?: boolean;
  pattern?: boolean;
}


export function usernameRequirements(control: AbstractControl): UsernameErrors | null {
  const minLengthValidator = Validators.minLength(3);
  const maxLengthValidator = Validators.maxLength(100);
  const patternValidator = Validators.pattern(/^[a-z0-9_-]+$/);
  const errors = {
    ...minLengthValidator(control),
    ...maxLengthValidator(control),
    ...patternValidator(control),
  }
  return Object.keys(errors).length ? errors : null;
}
