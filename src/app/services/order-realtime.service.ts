import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface OrderUpdatedEvent {
  orderId: string;
  event: string;
}

/**
 * Kênh chung báo "đơn hàng vừa thay đổi" (nhận qua Socket.IO).
 * Các trang danh sách đơn lắng nghe để tự tải lại dữ liệu.
 */
@Injectable({ providedIn: 'root' })
export class OrderRealtimeService {
  private readonly updatedSubject = new Subject<OrderUpdatedEvent>();
  readonly orderUpdated$ = this.updatedSubject.asObservable();

  emit(event: OrderUpdatedEvent): void {
    this.updatedSubject.next(event);
  }
}
