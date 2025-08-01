import { AbstractControl, Validators } from '@angular/forms';

interface UsernameErrors {
  required?: boolean;
  minlength?: {requiredLength: number, actualLength: number};
  maxlength?: {requiredLength: number, actualLength: number};
  pattern?: boolean;
}


export function usernameRequirements(control: AbstractControl): UsernameErrors | null {
  const validator = Validators.compose([
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(100),
    Validators.pattern(/^[a-z0-9_-]+$/),
  ])
  return validator!(control);
}
