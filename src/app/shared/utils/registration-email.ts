import { Router } from '@angular/router';

/**
 * Extracts the email address passed via router navigation extras or history state.
 * Provides a single place to keep this logic consistent across success pages.
 */
export function resolveRegistrationEmail(router: Router): string | null {
  const emailFromNavigation =
    router.getCurrentNavigation()?.extras.state?.['email'];
  if (typeof emailFromNavigation === 'string') {
    return emailFromNavigation;
  }

  if (typeof window !== 'undefined') {
    const emailFromHistory = window.history?.state?.email;
    if (typeof emailFromHistory === 'string') {
      return emailFromHistory;
    }
  }

  return null;
}
