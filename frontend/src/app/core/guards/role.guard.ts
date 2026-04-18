import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  if (auth.hasRole(...roles)) return true;
  inject(Router).navigate(['/tickets']);
  return false;
};
