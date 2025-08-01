import { AbstractControl, Validators } from '@angular/forms';

interface UsernameErrors {
  required?: boolean;
  minlength?: {requiredLength: number, actualLength: number};
  maxlength?: {requiredLength: number, actualLength: number};
  pattern?: boolean;
}


export function usernameRequirements(control: AbstractControl): UsernameErrors | null {
  const requiredValidator = Validators.required;
  const minLengthValidator = Validators.minLength(3);
  const maxLengthValidator = Validators.maxLength(100);
  const patternValidator = Validators.pattern(/^[a-z0-9_-]+$/);
  const errors = {
    ...requiredValidator(control),
    ...minLengthValidator(control),
    ...maxLengthValidator(control),
    ...patternValidator(control),
  }
  return Object.keys(errors).length ? errors : null;
}
