import { AbstractControl, ValidationErrors } from '@angular/forms';
import { toASCII } from 'punycode';

// https://biocloud.atlassian.net/browse/AAI-345
// email needs to conform to:
//  - username part <= 64 chars
//  - domain part <= 254 chars
// Angular's built in email validator cannot handle internationalized domain names and doesnt enforce the username/domain lenghts
// therefore we need custom validators here
const EMAIL_LOCAL_PART_MAX_LENGTH = 64;
const EMAIL_DOMAIN_MAX_LENGTH = 254;
const ASCII_EMAIL_REGEXP =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

interface EmailLengthErrors {
  localPartTooLong?: boolean;
  domainPartTooLong?: boolean;
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
  const asciiDomain = convertDomainToAscii(domain);
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
