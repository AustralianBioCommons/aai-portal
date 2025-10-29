import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { SBP_ALLOWED_EMAIL_DOMAINS } from '../../core/constants/constants';
import { toASCII } from 'punycode';

const EMAIL_LOCAL_PART_MAX_LENGTH = 64;
const EMAIL_DOMAIN_MAX_LENGTH = 254;
const ASCII_EMAIL_REGEXP =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

interface EmailLengthErrors {
  localPartTooLong?: boolean;
  domainPartTooLong?: boolean;
}

interface SbpEmailErrors extends EmailLengthErrors {
  required?: boolean;
  email?: boolean;
  invalidSbpEmailDomain?: boolean;
}

function normalizeEmailParts(
  value: string,
): { localPart: string; domain: string; asciiDomain: string | null } | null {
  if (!value) {
    return null;
  }

  const parts = value.split('@');
  if (parts.length < 2) {
    return null;
  }

  const localPart = parts.shift() ?? '';
  const domain = parts.join('@');
  const asciiDomain = (() => {
    try {
      const ascii = toASCII(domain.trim());
      return ascii ? ascii.toLowerCase() : null;
    } catch {
      return null;
    }
  })();
  return { localPart, domain, asciiDomain };
}

function convertDomainToAscii(domain: string): string | null {
  try {
    const ascii = toASCII(domain.trim());
    return ascii ? ascii.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function toAsciiEmail(value: string): string {
  const normalized = normalizeEmailParts(value);
  if (!normalized?.asciiDomain) {
    return value;
  }
  return `${normalized.localPart}@${normalized.asciiDomain}`;
}

export function emailLengthValidator(
  control: AbstractControl,
): EmailLengthErrors | null {
  const value: string | null | undefined = control.value;
  if (!value) {
    return null;
  }

  const normalized = normalizeEmailParts(value);
  if (!normalized) {
    return null;
  }

  const { localPart, asciiDomain, domain } = normalized;

  const effectiveDomain = asciiDomain ?? domain;

  if (localPart.length > EMAIL_LOCAL_PART_MAX_LENGTH) {
    return { localPartTooLong: true };
  }

  if (effectiveDomain.length > EMAIL_DOMAIN_MAX_LENGTH) {
    return { domainPartTooLong: true };
  }

  return null;
}

export function sbpEmailDomainRequired(
  control: AbstractControl,
): ValidationErrors | null {
  const email = control.value?.toLowerCase();
  if (!email) {
    return null;
  }

  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    return { invalidSbpEmailDomain: true };
  }

  const domain = email.slice(atIndex + 1);
  const asciiDomain = convertDomainToAscii(domain);
  if (!asciiDomain) {
    return { invalidSbpEmailDomain: true };
  }

  const isValidDomain = SBP_ALLOWED_EMAIL_DOMAINS.map((d) =>
    d.toLowerCase().replace(/^@/, '').replace(/\.$/, ''),
  ).includes(asciiDomain);

  return isValidDomain ? null : { invalidSbpEmailDomain: true };
}

/**
 * Validate requirements for SBP registration emails.
 * Must be a valid email format, meet length constraints, and be from an authorized domain.
 */
export function sbpEmailRequirements(
  control: AbstractControl,
): SbpEmailErrors | null {
  const validator = Validators.compose([
    Validators.required,
    internationalEmailValidator,
    emailLengthValidator,
    sbpEmailDomainRequired,
  ]);
  return validator!(control);
}

export function internationalEmailValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: string | null | undefined = control.value;
  if (!value) {
    return null;
  }

  const normalized = normalizeEmailParts(value);
  if (!normalized?.asciiDomain) {
    return { email: true };
  }

  const asciiEmail = `${normalized.localPart}@${normalized.asciiDomain}`;
  return ASCII_EMAIL_REGEXP.test(asciiEmail) ? null : { email: true };
}
