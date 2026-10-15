import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

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
  lucideChevronDown
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
      lucideChevronDown
    })
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayoutComponent {
  isSidebarCollapsed = false;

  menuItems = [
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

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}