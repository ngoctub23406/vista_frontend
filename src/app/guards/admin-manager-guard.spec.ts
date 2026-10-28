import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { adminManagerGuard } from './admin-manager-guard';

describe('adminManagerGuard', () => {
  const ordersUrl = {} as UrlTree;
  let router: Router;

  beforeEach(() => {
    localStorage.removeItem('vista_admin_token');
    localStorage.removeItem('vista_admin_user');
    router = {
      createUrlTree: vi.fn().mockReturnValue(ordersUrl),
    } as unknown as Router;
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });
  });

  afterEach(() => {
    localStorage.removeItem('vista_admin_token');
    localStorage.removeItem('vista_admin_user');
  });

  function setSession(role: string): void {
    localStorage.setItem('vista_admin_token', 'test-token');
    localStorage.setItem('vista_admin_user', JSON.stringify({ Role: role }));
  }

  function run(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => adminManagerGuard({} as never, {} as never)) as boolean | UrlTree;
  }

  it('allows Manager', () => {
    setSession('Manager');

    expect(run()).toBe(true);
  });

  it('redirects Staff to the orders page', () => {
    setSession('Staff');

    expect(run()).toBe(ordersUrl);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin/orders']);
  });

  it('redirects when there is no Admin session', () => {
    expect(run()).toBe(ordersUrl);
  });
});
