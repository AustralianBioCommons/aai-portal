import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { SBP_ALLOWED_EMAIL_DOMAINS } from '../../../core/constants/constants';

interface SbpEmailErrors {
  required?: boolean;
  email?: boolean;
  invalidSbpEmailDomain?: boolean;
}

export function sbpEmailDomainRequired(
  control: AbstractControl,
): ValidationErrors | null {
  const email = control.value.toLowerCase();
  if (!email) {
    return null;
  }
  const isValidDomain = SBP_ALLOWED_EMAIL_DOMAINS.some((domain) =>
    email.endsWith(domain.toLowerCase()),
  );
  return isValidDomain ? null : { invalidSbpEmailDomain: true };
}

/**
 * Validate requirements for SBP registration emails.
 * Must be a valid email format and from an authorized institution domain
 */
export function sbpEmailRequirements(
  control: AbstractControl,
): SbpEmailErrors | null {
  const validator = Validators.compose([
    Validators.required,
    Validators.email,
    sbpEmailDomainRequired,
  ]);
  return validator!(control);
}
