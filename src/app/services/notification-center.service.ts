import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { OrderRealtimeService, OrderUpdatedEvent } from './order-realtime.service';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string;
  link: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationListResponse {
  success: boolean;
  data?: { items: AppNotification[]; unreadCount: number };
}

const LIST_LIMIT = 20;

const FALLBACK_POLL_MS = 30000;

// Ưu tiên environment.socketUrl. Không có thì: apiUrl tuyệt đối (http://localhost:5000/api)
// → dùng origin đó; apiUrl tương đối (/api) → cùng origin, đi qua proxy /socket.io
function getSocketOrigin(): string | undefined {
  const socketUrl = (environment as { socketUrl?: string }).socketUrl;
  if (socketUrl) return socketUrl;

  try {
    return new URL(environment.apiUrl).origin;
  } catch {
    return undefined;
  }
}

/**
 * Quản lý thông báo realtime cho một người dùng (Admin hoặc khách hàng).
 * Mỗi chuông thông báo tự cung cấp một instance riêng (không providedIn root).
 */
@Injectable()
export class NotificationCenterService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly orderRealtime = inject(OrderRealtimeService);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  private socket?: Socket;
  private token = '';
  private fallbackTimer?: ReturnType<typeof setInterval>;

  readonly items$ = new BehaviorSubject<AppNotification[]>([]);
  readonly unreadCount$ = new BehaviorSubject<number>(0);
  readonly incoming$ = new Subject<AppNotification>();

  connect(token: string | null | undefined): void {
    const nextToken = String(token || '').trim();
    if (!nextToken) {
      this.disconnect();
      return;
    }

    if (nextToken === this.token && this.socket) {
      return;
    }

    this.disconnect();
    this.token = nextToken;
    this.load();

    const options = {
      auth: { token: nextToken },
      transports: ['websocket', 'polling'],
    };
    const origin = getSocketOrigin();
    this.socket = origin ? io(origin, options) : io(options);

    this.socket.on('notification:new', (notification: AppNotification) => {
      this.zone.run(() => this.receive(notification));
    });

    this.socket.on('order:updated', (payload: OrderUpdatedEvent) => {
      this.zone.run(() => this.orderRealtime.emit(payload));
    });

    // Mất kết nối rồi kết nối lại → tải lại để không sót thông báo
    this.socket.io.on('reconnect', () => {
      this.zone.run(() => this.load());
    });

    this.socket.on('connect', () => this.stopFallbackPolling());
    this.socket.on('disconnect', () => this.startFallbackPolling());
    this.socket.on('connect_error', (error) => {
      if (!this.fallbackTimer) {
        console.warn('[Thông báo] Không kết nối được realtime, chuyển sang tải định kỳ 30 giây.', error.message);
      }
      this.startFallbackPolling();
    });
  }

  disconnect(): void {
    this.stopFallbackPolling();
    this.socket?.removeAllListeners();
    this.socket?.io.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
    this.token = '';
    this.items$.next([]);
    this.unreadCount$.next(0);
  }

  load(): void {
    if (!this.token) return;

    this.http
      .get<NotificationListResponse>(this.apiUrl, {
        headers: this.headers(),
        params: { limit: LIST_LIMIT },
      })
      .subscribe({
        next: (response) => {
          this.items$.next(response.data?.items ?? []);
          this.unreadCount$.next(response.data?.unreadCount ?? 0);
        },
        error: () => {
          // Giữ nguyên danh sách hiện tại nếu tải lỗi
        },
      });
  }

  markAsRead(notification: AppNotification): void {
    if (!this.token || notification.isRead) return;

    this.items$.next(
      this.items$.value.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    );
    this.unreadCount$.next(Math.max(0, this.unreadCount$.value - 1));

    this.http
      .patch(`${this.apiUrl}/${encodeURIComponent(notification.id)}/read`, {}, { headers: this.headers() })
      .subscribe({ error: () => this.load() });
  }

  markAllAsRead(): void {
    if (!this.token || this.unreadCount$.value === 0) return;

    this.items$.next(this.items$.value.map((item) => ({ ...item, isRead: true })));
    this.unreadCount$.next(0);

    this.http
      .patch(`${this.apiUrl}/read-all`, {}, { headers: this.headers() })
      .subscribe({ error: () => this.load() });
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.incoming$.complete();
  }

  // Khi socket chưa kết nối được thì vẫn tải thông báo định kỳ để không phải bấm chuông
  private startFallbackPolling(): void {
    if (this.fallbackTimer || !this.token) return;
    this.fallbackTimer = setInterval(() => this.zone.run(() => this.load()), FALLBACK_POLL_MS);
  }

  private stopFallbackPolling(): void {
    clearInterval(this.fallbackTimer);
    this.fallbackTimer = undefined;
  }

  private receive(notification: AppNotification): void {
    if (this.items$.value.some((item) => item.id === notification.id)) return;

    this.items$.next([notification, ...this.items$.value].slice(0, LIST_LIMIT));
    if (!notification.isRead) {
      this.unreadCount$.next(this.unreadCount$.value + 1);
    }
    this.incoming$.next(notification);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }
}
