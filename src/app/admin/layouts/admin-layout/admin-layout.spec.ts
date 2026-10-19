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

  it('clears the Admin session and navigates to the Admin login on logout', () => {
    createComponent('Manager');

    component.logout();

    expect(localStorage.getItem('vista_admin_token')).toBeNull();
    expect(localStorage.getItem('vista_admin_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
