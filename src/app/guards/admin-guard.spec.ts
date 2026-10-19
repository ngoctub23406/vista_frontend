import { Router, UrlTree } from '@angular/router';
import { AdminGuard } from './admin-guard';

describe('AdminGuard', () => {
  const loginUrl = {} as UrlTree;
  let router: Router;
  let guard: AdminGuard;

  beforeEach(() => {
    localStorage.removeItem('vista_admin_token');
    localStorage.removeItem('vista_admin_user');
    router = {
      createUrlTree: vi.fn().mockReturnValue(loginUrl),
    } as unknown as Router;
    guard = new AdminGuard(router);
  });

  afterEach(() => {
    localStorage.removeItem('vista_admin_token');
    localStorage.removeItem('vista_admin_user');
  });

  function setSession(role: string): void {
    localStorage.setItem('vista_admin_token', 'test-token');
    localStorage.setItem('vista_admin_user', JSON.stringify({ Role: role }));
  }

  it.each(['Manager', 'Staff'])('allows %s on Admin routes', (role) => {
    setSession(role);

    expect(guard.canActivate()).toBe(true);
    expect(guard.canActivateChild()).toBe(true);
  });

  it.each([
    ['missing session', () => undefined],
    ['missing role', () => {
      localStorage.setItem('vista_admin_token', 'test-token');
      localStorage.setItem('vista_admin_user', JSON.stringify({}));
    }],
    ['invalid role', () => setSession('Customer')],
    ['missing token', () => localStorage.setItem(
      'vista_admin_user', JSON.stringify({ Role: 'Manager' })
    )],
    ['malformed user JSON', () => {
      localStorage.setItem('vista_admin_token', 'test-token');
      localStorage.setItem('vista_admin_user', '{');
    }],
  ])('redirects and clears the Admin session for %s', (_caseName, setInvalidSession) => {
    setInvalidSession();

    expect(guard.canActivate()).toBe(loginUrl);
    expect(guard.canActivateChild()).toBe(loginUrl);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/login']);
    expect(localStorage.getItem('vista_admin_token')).toBeNull();
    expect(localStorage.getItem('vista_admin_user')).toBeNull();
  });
});