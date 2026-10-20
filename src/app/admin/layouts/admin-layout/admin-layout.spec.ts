import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AdminLayoutComponent } from './admin-layout';

describe('AdminLayout', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    localStorage.removeItem('vista_admin_token');
    localStorage.removeItem('vista_admin_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    vi.restoreAllMocks();
  });

  function createComponent(role: string): void {
    localStorage.setItem('vista_admin_token', 'test-token');
    localStorage.setItem('vista_admin_user', JSON.stringify({ Role: role }));
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent('Manager');
    expect(component).toBeTruthy();
  });

  it('shows all six menu items to a Manager', () => {
    createComponent('Manager');

    expect(fixture.nativeElement.querySelectorAll('.menu-item').length).toBe(6);
  });

  it('shows only the four operational menu items to Staff', () => {
    createComponent('Staff');

    const menuItems = Array.from(
      fixture.nativeElement.querySelectorAll('.menu-item') as NodeListOf<HTMLElement>
    ).map((item) => item.textContent?.trim());

    expect(menuItems.length).toBe(4);
    expect(menuItems).toEqual([
      'Danh mục sản phẩm',
      'Xử lý đơn hàng',
      'Hậu mãi & Đổi trả',
      'Kiểm duyệt đánh giá',
    ]);
  });

  it('shows no menu items for an invalid role', () => {
    createComponent('Customer');

    expect(fixture.nativeElement.querySelectorAll('.menu-item').length).toBe(0);
  });

  it('shows the signed-in Admin name, role and avatar initial', () => {
    localStorage.setItem('vista_admin_user', JSON.stringify({
      Full_name: 'Nguyen Thi An',
      Username: 'an.nguyen',
      Role: 'Staff',
    }));
    createComponent('Staff');

    expect(fixture.nativeElement.querySelector('.admin-info strong').textContent.trim())
      .toBe('Nguyen Thi An');
    expect(fixture.nativeElement.querySelector('.admin-info span').textContent.trim())
      .toBe('Staff');
    expect(fixture.nativeElement.querySelector('.admin-avatar').textContent.trim())
      .toBe('N');
    expect(fixture.nativeElement.querySelector('.account-info strong').textContent.trim())
      .toBe('Nguyen Thi An');
    expect(fixture.nativeElement.querySelector('.account-info span').textContent.trim())
      .toBe('Staff');
    expect(fixture.nativeElement.querySelector('.header-avatar').textContent.trim())
      .toBe('N');
  });

  it('opens the shared account menu from the Header without logging out', () => {
    createComponent('Manager');
    const logoutSpy = vi.spyOn(component, 'logout');

    component.toggleAccountMenu('header');
    fixture.detectChanges();

    expect(component.isAccountMenuOpen).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeTruthy();
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('vista_admin_token')).toBe('test-token');
  });

  it('opens the account menu and closes it with Escape', () => {
    createComponent('Manager');

    component.toggleAccountMenu('sidebar');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeTruthy();

    component.closeAccountMenuOnEscape();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('navigates to the Admin password change page from the account menu', () => {
    createComponent('Manager');

    component.goToChangePassword();

    expect(component.isAccountMenuOpen).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/change-password']);
  });

  it('clears the Admin session and navigates to the Admin login on logout', () => {
    createComponent('Manager');
    localStorage.setItem('token', 'customer-token');
    localStorage.setItem('user', JSON.stringify({ Role: 'Customer' }));

    component.logout();

    expect(localStorage.getItem('vista_admin_token')).toBeNull();
    expect(localStorage.getItem('vista_admin_user')).toBeNull();
    expect(localStorage.getItem('token')).toBe('customer-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify({ Role: 'Customer' }));
    expect(router.navigate).toHaveBeenCalledWith(
      ['/admin/login'],
      { replaceUrl: true },
    );
  });
});
