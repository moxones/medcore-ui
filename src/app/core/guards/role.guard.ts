import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';
import { Role, ROLE_REDIRECTS } from '@core/models/role.model';

export const roleGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles: Role[] = route.data?.['roles'] ?? [];
  if (allowedRoles.length === 0) return true;

  const userRoles = authStore.roles();
  const hasRole = allowedRoles.some((r) => userRoles.includes(r));

  if (!hasRole) {
    const priority: Role[] = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'PATIENT'];
    const primaryRole = priority.find((r) => userRoles.includes(r));
    return primaryRole
      ? router.createUrlTree([ROLE_REDIRECTS[primaryRole]])
      : router.createUrlTree(['/login']);
  }

  return true;
};
