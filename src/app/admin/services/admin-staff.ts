import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export type StaffRole = 'Manager' | 'Staff';
export type StaffStatus = 'active' | 'blocked';

export interface AdminStaffMember {
  User_id: string;
  Full_name: string;
  Username: string;
  Email: string;
  Phone_number: string;
  Role: StaffRole;
  Status: StaffStatus;
  Created_at: string | null;
}

export interface AdminStaffFilters {
  keyword?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/** Dữ liệu form Thêm / Chỉnh sửa nhân viên */
export interface AdminStaffPayload {
  Full_name: string;
  Email: string;
  Phone_number: string;
  Role: 'Staff';
  Status: StaffStatus;
}

export interface AdminStaffApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Kết quả kiểm tra email / số điện thoại đã thuộc tài khoản khác chưa */
export interface AdminStaffAvailability {
  email_taken: boolean;
  phone_taken: boolean;
}

export interface AdminStaffListData {
  items: AdminStaffMember[];
  /** Số nhân viên khớp bộ lọc hiện tại */
  total: number;
  page: number;
  limit: number;
  /** Tổng số nhân viên trong hệ thống (không theo bộ lọc) */
  system_total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminStaffService {
  private readonly apiUrl = `${environment.apiUrl}/admin/staff`;

  constructor(private http: HttpClient) {}

  getStaffList(filters: AdminStaffFilters): Observable<AdminStaffApiResponse<AdminStaffListData>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.withAuth((headers) =>
      this.http.get<AdminStaffApiResponse<AdminStaffListData>>(this.apiUrl, { headers, params }),
    );
  }

  /** Kiểm tra trùng email / số điện thoại khi nhập form; excludeUserId = nhân viên đang sửa */
  checkAvailability(
    values: { email?: string; phone?: string },
    excludeUserId?: string,
  ): Observable<AdminStaffApiResponse<AdminStaffAvailability>> {
    let params = new HttpParams();
    if (values.email) params = params.set('email', values.email);
    if (values.phone) params = params.set('phone', values.phone);
    if (excludeUserId) params = params.set('exclude', excludeUserId);

    return this.withAuth((headers) =>
      this.http.get<AdminStaffApiResponse<AdminStaffAvailability>>(`${this.apiUrl}/availability`, { headers, params }),
    );
  }

  getStaffDetail(userId: string): Observable<AdminStaffApiResponse<AdminStaffMember>> {
    return this.withAuth((headers) =>
      this.http.get<AdminStaffApiResponse<AdminStaffMember>>(`${this.apiUrl}/${encodeURIComponent(userId)}`, { headers }),
    );
  }

  createStaff(payload: AdminStaffPayload): Observable<AdminStaffApiResponse<AdminStaffMember>> {
    return this.withAuth((headers) =>
      this.http.post<AdminStaffApiResponse<AdminStaffMember>>(this.apiUrl, payload, { headers }),
    );
  }

  updateStaff(userId: string, payload: AdminStaffPayload): Observable<AdminStaffApiResponse<AdminStaffMember>> {
    return this.withAuth((headers) =>
      this.http.patch<AdminStaffApiResponse<AdminStaffMember>>(
        `${this.apiUrl}/${encodeURIComponent(userId)}`,
        payload,
        { headers },
      ),
    );
  }

  lockStaff(userId: string): Observable<AdminStaffApiResponse<AdminStaffMember>> {
    return this.withAuth((headers) =>
      this.http.patch<AdminStaffApiResponse<AdminStaffMember>>(
        `${this.apiUrl}/${encodeURIComponent(userId)}/lock`,
        {},
        { headers },
      ),
    );
  }

  unlockStaff(userId: string): Observable<AdminStaffApiResponse<AdminStaffMember>> {
    return this.withAuth((headers) =>
      this.http.patch<AdminStaffApiResponse<AdminStaffMember>>(
        `${this.apiUrl}/${encodeURIComponent(userId)}/unlock`,
        {},
        { headers },
      ),
    );
  }

  private withAuth<T>(request: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    const token = localStorage.getItem('vista_admin_token');
    if (!token) {
      return throwError(() => new Error('Vui lòng đăng nhập lại để tiếp tục.'));
    }

    return request(new HttpHeaders({ Authorization: `Bearer ${token}` }));
  }
}
