import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';

export type AdminRole = 'Manager' | 'Staff';

export function getAdminRole(): AdminRole | null {
  try {
    if (!localStorage.getItem('vista_admin_token')) {
      return null;
    }

    const user = JSON.parse(localStorage.getItem('vista_admin_user') ?? 'null');
    return user?.Role === 'Manager' || user?.Role === 'Staff'
      ? user.Role
      : null;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem('vista_admin_token');
  localStorage.removeItem('vista_admin_user');
}

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate, CanActivateChild {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.checkAccess();
  }

  canActivateChild(): boolean | UrlTree {
    return this.checkAccess();
  }

  private checkAccess(): boolean | UrlTree {
    if (getAdminRole()) {
      return true;
    }

    clearAdminSession();
    return this.router.createUrlTree(['/admin/login']);
  }
}