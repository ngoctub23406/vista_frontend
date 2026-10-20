import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { clearAdminSession, getAdminRole } from '../../../guards/admin-guard';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideUsers,
  lucidePackage,
  lucideShoppingBag,
  lucideRotateCcw,
  lucideMessageSquare,
  lucideMenu,
  lucideBell,
  lucideChevronDown,
  lucideKeyRound,
  lucideLogOut
} from '@ng-icons/lucide';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgIcon
  ],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucideUsers,
      lucidePackage,
      lucideShoppingBag,
      lucideRotateCcw,
      lucideMessageSquare,
      lucideMenu,
      lucideBell,
      lucideChevronDown,
      lucideKeyRound,
      lucideLogOut
    })
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayoutComponent {
  isSidebarCollapsed = false;
  isAccountMenuOpen = false;
  accountMenuPlacement: 'sidebar' | 'header' = 'sidebar';
  accountName = 'Quản trị viên';
  accountRole = 'Tài khoản Admin';
  accountInitial = 'Q';

  @ViewChild('sidebarAccount')
  private sidebarAccount?: ElementRef<HTMLElement>;

  @ViewChild('accountMenuTrigger')
  private sidebarAccountMenuTrigger?: ElementRef<HTMLButtonElement>;

  @ViewChild('headerAccountMenuTrigger')
  private headerAccountMenuTrigger?: ElementRef<HTMLButtonElement>;

  @ViewChild('accountMenu')
  private accountMenu?: ElementRef<HTMLElement>;

  private readonly allMenuItems = [
    {
      label: 'Tổng quan',
      icon: 'lucideLayoutDashboard',
      route: '/admin/dashboard'
    },
    {
      label: 'Quản lý nhân sự',
      icon: 'lucideUsers',
      route: '/admin/staff'
    },
    {
      label: 'Danh mục sản phẩm',
      icon: 'lucidePackage',
      route: '/admin/products'
    },
    {
      label: 'Xử lý đơn hàng',
      icon: 'lucideShoppingBag',
      route: '/admin/orders'
    },
    {
      label: 'Hậu mãi & Đổi trả',
      icon: 'lucideRotateCcw',
      route: '/admin/returns'
    },
    {
      label: 'Kiểm duyệt đánh giá',
      icon: 'lucideMessageSquare',
      route: '/admin/reviews'
    }
  ];

  menuItems = (() => {
    const role = getAdminRole();
    if (role === 'Manager') {
      return this.allMenuItems;
    }
    if (role === 'Staff') {
      return this.allMenuItems.filter((item) =>
        item.route !== '/admin/dashboard' && item.route !== '/admin/staff'
      );
    }
    return [];
  })();

  constructor(private router: Router) {
    this.loadAccountInfo();
  }

  private loadAccountInfo(): void {
    this.accountRole = getAdminRole() ?? 'Tài khoản Admin';

    try {
      const storedUser = localStorage.getItem('vista_admin_user');
      if (storedUser) {
        const user: unknown = JSON.parse(storedUser);
        if (user && typeof user === 'object' && !Array.isArray(user)) {
          const account = user as Record<string, unknown>;
          const fullName = this.getStoredText(account['Full_name']);
          const username = this.getStoredText(account['Username']);
          const email = this.getStoredText(account['Email']);

          this.accountName = fullName || username || email || this.accountName;
        }
      }
    } catch (error) {
      console.warn('Không thể đọc thông tin tài khoản Admin đã lưu.', error);
    }

    this.accountInitial = Array.from(this.accountName.trim())[0]?.toLocaleUpperCase() ?? 'Q';
  }

  private getStoredText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  get isDashboardRoute(): boolean {
    return this.router.url.split(/[?#]/, 1)[0] === '/admin/dashboard';
  }

  toggleAccountMenu(placement: 'sidebar' | 'header'): void {
    if (this.isAccountMenuOpen && this.accountMenuPlacement === placement) {
      this.isAccountMenuOpen = false;
      return;
    }

    this.accountMenuPlacement = placement;
    this.isAccountMenuOpen = true;
  }

  goToChangePassword(): void {
    this.isAccountMenuOpen = false;
    this.router.navigate(['/admin/change-password']);
  }

  @HostListener('document:click', ['$event'])
  closeAccountMenuOnOutsideClick(event: MouseEvent): void {
    if (
      event.target instanceof Node &&
      !this.sidebarAccount?.nativeElement.contains(event.target) &&
      !this.headerAccountMenuTrigger?.nativeElement.contains(event.target) &&
      !this.accountMenu?.nativeElement.contains(event.target)
    ) {
      this.isAccountMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  closeAccountMenuOnEscape(): void {
    if (!this.isAccountMenuOpen) {
      return;
    }

    this.isAccountMenuOpen = false;
    if (this.accountMenuPlacement === 'header') {
      this.headerAccountMenuTrigger?.nativeElement.focus();
    } else {
      this.sidebarAccountMenuTrigger?.nativeElement.focus();
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    clearAdminSession();
    this.isAccountMenuOpen = false;
    this.router.navigate(['/admin/login'], { replaceUrl: true });
  }
}