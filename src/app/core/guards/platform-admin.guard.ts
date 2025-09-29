import { CanActivateFn } from '@angular/router';
import { ApiService } from '../services/api.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

/**
 * Guard that checks if the user has admin rights to the specified platforms
 * (based on the /me/platforms/admin-roles backend endpoint)
 * Needs to be initialized with the platform ID,
 * e.g. canActivate: [platformAdminGuard('galaxy')]
 */
export function platformAdminGuard(platformId: string): CanActivateFn {
  return () => {
    const apiService = inject(ApiService);
    const adminPlatforms = apiService.getAdminPlatforms();
    return adminPlatforms.pipe(
      map((platforms) => platforms.some((p) => p.id === platformId)),
    );
  };
}
