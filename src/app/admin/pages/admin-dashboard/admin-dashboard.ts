import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarDays,
  lucideTrendingUp,
  lucideShoppingBag,
  lucidePackage,
  lucideUsers,
  lucideEye,
  lucideSearch,
  lucideMousePointerClick,
  lucideShoppingCart,
  lucideArrowUpRight,
  lucideArrowDownRight,
  lucideDownload,
  lucideChevronDown,
  lucideClock,
  lucideCircleCheck,
  lucideTruck,
  lucideCreditCard,
  lucideRefreshCw
} from '@ng-icons/lucide';

type RevenuePeriod = '7days' | '30days' | '12months';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      lucideCalendarDays,
      lucideTrendingUp,
      lucideShoppingBag,
      lucidePackage,
      lucideUsers,
      lucideEye,
      lucideSearch,
      lucideMousePointerClick,
      lucideShoppingCart,
      lucideArrowUpRight,
      lucideArrowDownRight,
      lucideDownload,
      lucideChevronDown,
      lucideClock,
      lucideCircleCheck,
      lucideTruck,
      lucideCreditCard,
      lucideRefreshCw
    })
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {
  selectedPeriod: RevenuePeriod = '30days';

  // Dữ liệu minh họa giao diện, không phải doanh thu thực tế.
  private readonly demoRevenue = {
    '7days': {
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      values: [12, 18, 15, 25, 21, 32, 28]
    },
    '30days': {
      labels: ['01', '05', '10', '15', '20', '25', '30'],
      values: [18, 25, 20, 38, 30, 45, 40]
    },
    '12months': {
      labels: [
        'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
        'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
      ],
      values: [22, 28, 25, 35, 30, 42, 38, 48, 40, 55, 49, 62]
    }
  };

  get periodLabel(): string {
    switch (this.selectedPeriod) {
      case '7days':
        return '7 ngày gần nhất';
      case '12months':
        return '12 tháng gần nhất';
      default:
        return '30 ngày gần nhất';
    }
  }

  get revenueLabels(): string[] {
    return this.demoRevenue[this.selectedPeriod].labels;
  }

  get revenuePoints(): { x: number; y: number; value: number }[] {
    const values = this.demoRevenue[this.selectedPeriod].values;
    const width = 600;
    const height = 200;
    const max = Math.max(...values) * 1.15;
    const min = 0;

    return values.map((value, index) => ({
      x: values.length === 1
        ? width / 2
        : (index / (values.length - 1)) * width,
      y: height - ((value - min) / (max - min)) * height,
      value
    }));
  }

  get revenueLine(): string {
    return this.revenuePoints
      .map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      )
      .join(' ');
  }

  get revenueArea(): string {
    const points = this.revenuePoints;

    if (!points.length) {
      return '';
    }

    return `${this.revenueLine} L 600 200 L 0 200 Z`;
  }

  get maxRevenue(): number {
    return Math.max(...this.demoRevenue[this.selectedPeriod].values);
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === '7days' || value === '30days' || value === '12months') {
      this.selectedPeriod = value;
    }
  }

  // Sẽ thay bằng dữ liệu API khi backend có endpoint thống kê.
  orderStatuses = [
    { label: 'Chờ xử lý', className: 'pending' },
    { label: 'Đang xử lý', className: 'processing' },
    { label: 'Đang giao', className: 'shipping' },
    { label: 'Hoàn thành', className: 'completed' },
    { label: 'Đã hủy', className: 'cancelled' }
  ];
}
